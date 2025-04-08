"use client"

import { FontAwesome5, MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons"
import { createDrawerNavigator } from "@react-navigation/drawer"
import { LinearGradient } from "expo-linear-gradient"
import { useEffect, useState } from "react"
import { Alert, Dimensions, Image, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native"
import { Badge, Button, Text } from "react-native-paper"
import { auth, collection, db, getDocs, query, signOut, where } from "../config/fb.js"

import Agricultural from "./Components/Agricultural"
import ProductDetails from "./Components/ProductDetails"
import BuyerProfileScreen from "./Components/ProfileScreen.js"
import CartScreen from "./Components/cart-screen"
import MyOrdersScreen from "./Components/my-orders-screen"

const { width } = Dimensions.get("window")
const Drawer = createDrawerNavigator()

const GradientBackground = ({ colors, style, children }) => (
  <View style={[styles.gradientContainer, style]}>
    {colors.map((color, index) => (
      <View
        key={index}
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: color,
            opacity: 1 - index / colors.length,
          },
        ]}
      />
    ))}
    {children}
  </View>
)

const CategoryCard = ({ title, icon, imagePrompt, onPress }) => (
  <TouchableOpacity style={styles.categoryCard} onPress={onPress}>
    <Image
      source={{ uri: `https://api.a0.dev/assets/image?text=${encodeURIComponent(imagePrompt)}&aspect=16:9` }}
      style={styles.categoryBackground}
    />
    <LinearGradient colors={["rgba(0,0,0,0.3)", "rgba(0,0,0,0.7)"]} style={styles.categoryGradient}>
      <View style={styles.categoryContent}>
        {icon}
        <Text style={styles.categoryTitle}>{title}</Text>
      </View>
    </LinearGradient>
  </TouchableOpacity>
)

const HomeScreen = ({ navigation }) => {
  const [cartItemCount, setCartItemCount] = useState(0)

  useEffect(() => {
    fetchCartItemCount()

    const unsubscribe = navigation.addListener("focus", () => {
      fetchCartItemCount()
    })

    return unsubscribe
  }, [navigation])

  const fetchCartItemCount = async () => {
    try {
      if (auth.currentUser) {
        const userEmail = auth.currentUser.email
        const cartQuery = query(collection(db, "cart"), where("userEmail", "==", userEmail))

        const querySnapshot = await getDocs(cartQuery)
        setCartItemCount(querySnapshot.size)
      }
    } catch (error) {
      console.error("Error fetching cart count:", error)
    }
  }

  const navigateToCategory = (category) => {
    navigation.navigate("Agricultural", { initialCategory: category })
  }

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.openDrawer()}>
          <MaterialIcons name="menu" size={28} color="#2c3e50" />
        </TouchableOpacity>

        <Text style={styles.topBarTitle}>RawConnect</Text>

        <TouchableOpacity style={styles.cartButton} onPress={() => navigation.navigate("Cart")}>
          <MaterialIcons name="shopping-cart" size={28} color="#2c3e50" />
          {cartItemCount > 0 && <Badge style={styles.cartBadge}>{cartItemCount}</Badge>}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollContainer}>
        <GradientBackground colors={["#2c3e50", "#34495e"]} style={styles.header}>
          <Text style={styles.headerText}>Marketplace</Text>
          <Text style={styles.subHeaderText}>Discover products without intermediaries!</Text>
        </GradientBackground>

        <View style={styles.categoriesContainer}>
          <Text style={styles.sectionTitle}>Categories</Text>
          <View style={styles.categoriesGrid}>
            <CategoryCard
              title="Agricultural Products"
              icon={<MaterialCommunityIcons name="tractor" size={40} color="white" />}
              onPress={() => navigateToCategory("Agricultural")}
              imagePrompt="modern agricultural machinery in a vast golden wheat field at sunset, dramatic lighting"
            />
            <CategoryCard
              title="Minerals and Metals"
              icon={<MaterialCommunityIcons name="mine" size={40} color="white" />}
              onPress={() => navigateToCategory("Mineral")}
              imagePrompt="industrial mining operation with massive machinery and raw minerals, dramatic industrial scene"
            />
            <CategoryCard
              title="Forest Products"
              icon={<FontAwesome5 name="tree" size={40} color="white" />}
              onPress={() => navigateToCategory("Forestal")}
              imagePrompt="sustainable forestry operation with lumber mill and forest management, morning mist"
            />
            <CategoryCard
              title="Chemicals and Petrochemicals"
              icon={<MaterialIcons name="science" size={40} color="white" />}
              onPress={() => navigateToCategory("Chemical")}
              imagePrompt="modern chemical plant with sophisticated equipment and blue lighting, industrial scene"
            />
          </View>
        </View>

        { }
        <View style={styles.aboutSection}>
          <Text style={styles.aboutTitle}>About RawConnect</Text>

          <View style={styles.aboutCard}>
            <View style={styles.aboutImageContainer}>
              <Image source={require("../assets/carrito.jpg")} style={styles.aboutImage} resizeMode="cover" />
            </View>
            <View style={styles.aboutContent}>
              <Text style={styles.aboutHeading}>Direct Sourcing</Text>
              <Text style={styles.aboutText}>
                Connect directly with producers and eliminate intermediaries, ensuring better prices and authentic
                products.
              </Text>
            </View>
          </View>

          <View style={styles.aboutCard}>
            <View style={styles.aboutContent}>
              <Text style={styles.aboutHeading}>Sustainable Trade</Text>
              <Text style={styles.aboutText}>
                Support sustainable practices and responsible sourcing with our transparent system.
              </Text>
            </View>
            <View style={styles.aboutImageContainer}>
              <Image source={require("../assets/e comerce.png")} style={styles.aboutImage} resizeMode="cover" />
            </View>
          </View>

          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>500+</Text>
              <Text style={styles.statLabel}>Producers</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>50+</Text>
              <Text style={styles.statLabel}>Countries</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>10K+</Text>
              <Text style={styles.statLabel}>Products</Text>
            </View>
          </View>

          <View style={styles.missionCard}>
            <Text style={styles.missionTitle}>Our Mission</Text>
            <Text style={styles.missionText}>
              "To create a transparent marketplace that connects buyers directly with producers, promoting fair trade
              and sustainable practices across global supply chains."
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  )
}

const handleSignOut = (navigation) => {
  signOut(auth)
    .then(() => {
      Alert.alert("Success", "You have been signed out.")
      navigation.reset({
        index: 0,
        routes: [{ name: "Login" }],
      })
    })
    .catch((error) => {
      console.error("Error signing out: ", error)
      Alert.alert("Error", "An error occurred while signing out.")
    })
}

const DrawerContent = (props) => {
  const [cartItemCount, setCartItemCount] = useState(0)

  useEffect(() => {
    fetchCartItemCount()

    const unsubscribeFocus = props.navigation.addListener("focus", () => {
      fetchCartItemCount()
    })

    return unsubscribeFocus
  }, [props.navigation])

  const fetchCartItemCount = async () => {
    try {
      if (auth.currentUser) {
        const userEmail = auth.currentUser.email
        const cartQuery = query(collection(db, "cart"), where("userEmail", "==", userEmail))

        const querySnapshot = await getDocs(cartQuery)
        setCartItemCount(querySnapshot.size)
      }
    } catch (error) {
      console.error("Error fetching cart count:", error)
    }
  }


  return (
    <GradientBackground colors={["#2c3e50", "#34495e"]} style={styles.drawerContent}>
      <View style={styles.drawerHeader}>
        <Text style={styles.drawerTitle}>RawConnect</Text>
      </View>
      <View style={styles.drawerItems}>
        <Button
          icon="home"
          mode="contained"
          onPress={() => props.navigation.navigate("Home")}
          style={styles.drawerButton}
        >
          Home
        </Button>
        <Button
          icon="account"
          mode="contained"
          onPress={() => props.navigation.navigate("Profile")}
          style={styles.drawerButton}
        >
          Profile
        </Button>
        <Button
          icon="shopping"
          mode="contained"
          onPress={() => props.navigation.navigate("Cart")}
          style={styles.drawerButton}
        >
          Cart {cartItemCount > 0 && `(${cartItemCount})`}
        </Button>
        <Button
          icon="package-variant"
          mode="contained"
          onPress={() => props.navigation.navigate("MyOrders")}
          style={styles.drawerButton}
        >
          My Orders
        </Button>
        <Button icon="cog" mode="contained" onPress={() => alert("Configuración")} style={styles.drawerButton}>
          Configuración
        </Button>
        <Button
          icon="logout"
          mode="contained"
          onPress={() => handleSignOut(props.navigation)}
          style={styles.signOutButton}
        >
          Sign Out
        </Button>
      </View>
    </GradientBackground>
  )
}

const MainBuyer = () => {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <DrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Drawer.Screen name="Home" component={HomeScreen} />
      <Drawer.Screen name="Profile" component={BuyerProfileScreen} options={{ title: "Perfil" }} />
      <Drawer.Screen name="Agricultural" component={Agricultural} options={{ title: "Agricultural" }} />

      <Drawer.Screen
        name="ProductDetails"
        component={ProductDetails}
        options={{
          title: "Product Details",
          headerShown: false,
        }}
      />
      <Drawer.Screen name="Cart" component={CartScreen} options={{ title: "Shopping Cart" }} />
      <Drawer.Screen name="MyOrders" component={MyOrdersScreen} options={{ title: "My Orders" }} />
    </Drawer.Navigator>
  )
}

const styles = StyleSheet.create({
  signOutButton: {
    marginTop: 20,
    backgroundColor: "#D32F2F",
  },
  container: {
    flex: 1,
    backgroundColor: "#ecf0f1",
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingTop: 40,
    paddingBottom: 10,
    backgroundColor: "#fff",
    elevation: 4,
  },
  topBarTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2c3e50",
  },
  cartButton: {
    position: "relative",
  },
  cartBadge: {
    position: "absolute",
    top: -5,
    right: -5,
    backgroundColor: "#6bb2db",
  },
  scrollContainer: {
    flex: 1,
  },
  gradientContainer: {
    overflow: "hidden",
  },
  header: {
    padding: 20,
    paddingTop: 40,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerText: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
  },
  subHeaderText: {
    fontSize: 18,
    color: "#fff",
    marginTop: 10,
    textAlign: "center",
  },
  categoriesContainer: {
    padding: 16,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
    color: "#263238",
    textAlign: "center",
  },
  categoriesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  categoryCard: {
    width: (width - 48) / 2,
    height: 160,
    marginBottom: 16,
    borderRadius: 16,
    overflow: "hidden",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  categoryBackground: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },
  categoryGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  categoryContent: {
    alignItems: "center",
    padding: 16,
  },
  categoryTitle: {
    color: "white",
    fontSize: 15,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 12,
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  profileButton: {
    margin: 20,
    backgroundColor: "#2c3e50",
  },
  drawerContent: {
    flex: 1,
    paddingTop: 50,
  },
  drawerHeader: {
    alignItems: "center",
    marginBottom: 20,
  },
  drawerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
  },
  drawerItems: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  drawerButton: {
    marginBottom: 10,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  // Estilos para la sección About RawConnect
  aboutSection: {
    padding: 20,
    marginTop: 10,
    marginBottom: 30,
  },
  aboutTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#2c3e50",
    textAlign: "center",
  },
  aboutCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 16,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  aboutImagePlaceholder: {
    width: width * 0.35,
    backgroundColor: "#e0e0e0",
    justifyContent: "center",
    alignItems: "center",
  },
  aboutImageContainer: {
    width: width * 0.35,
    overflow: "hidden",
  },
  aboutImage: {
    width: "100%",
    height: 200,
  },
  placeholderText: {
    color: "#757575",
    fontSize: 12,
    textAlign: "center",
    padding: 10,
  },
  aboutContent: {
    flex: 1,
    padding: 15,
    justifyContent: "center",
  },
  aboutHeading: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: 8,
  },
  aboutText: {
    fontSize: 14,
    color: "#546E7A",
    lineHeight: 20,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 20,
    paddingHorizontal: 10,
  },
  statItem: {
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 12,
    width: width * 0.27,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 14,
    color: "#546E7A",
  },
  missionCard: {
    backgroundColor: "#2c3e50",
    borderRadius: 16,
    padding: 20,
    marginTop: 10,
  },
  missionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 10,
    textAlign: "center",
  },
  missionText: {
    fontSize: 15,
    color: "#ecf0f1",
    lineHeight: 22,
    textAlign: "center",
    fontStyle: "italic",
  },
})

export default MainBuyer

