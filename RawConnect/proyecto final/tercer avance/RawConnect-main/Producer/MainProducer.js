"use client"

import { useFocusEffect, useNavigation } from "@react-navigation/native"
import { LinearGradient } from "expo-linear-gradient"
import { StatusBar } from "expo-status-bar"
import { doc, getDoc } from "firebase/firestore"
import { useCallback, useEffect, useState } from "react"
import { Animated, Dimensions, ImageBackground, StyleSheet, View } from "react-native"
import { Avatar, Button, IconButton, Surface, Text, useTheme } from "react-native-paper"
import { auth, db } from "../config/fb.js"

const { width } = Dimensions.get("window")

const MainProducer = () => {
  const theme = useTheme()
  const navigation = useNavigation()
  const [userData, setUserData] = useState(null)
  const [loading, setLoading] = useState(true)
  const fadeAnim = useState(new Animated.Value(0))[0]
  const slideAnim = useState(new Animated.Value(50))[0]

  const fetchUserData = async () => {
    try {
      const currentUser = auth.currentUser
      if (currentUser) {
        const userDocRef = doc(db, "users", currentUser.email)
        const userDoc = await getDoc(userDocRef)

        if (userDoc.exists()) {
          setUserData({
            email: currentUser.email,
            ...userDoc.data(),
          })
        } else {
          setUserData({
            email: currentUser.email,
            fullName: currentUser.displayName || "Producer",
          })
        }
      }
    } catch (error) {
      console.error("Error fetching user data:", error)
    } finally {
      setLoading(false)
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        })
      ]).start()
    }
  }

  useEffect(() => {
    fetchUserData()
  }, [])

  useFocusEffect(
    useCallback(() => {
      fetchUserData()
    }, [])
  )

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <ImageBackground
        source={{ uri: "https://i.imgur.com/JFHjdNr.png" }}
        style={styles.backgroundPattern}
        imageStyle={styles.backgroundImage}
      >
        <LinearGradient
          colors={['rgba(44, 62, 80, 0.9)', 'rgba(44, 62, 80, 0.98)']}
          style={styles.gradient}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Producer Dashboard</Text>
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <IconButton icon="star" size={16} iconColor="#e67e22" style={styles.dividerIcon} />
              <View style={styles.dividerLine} />
            </View>

            {!loading && (
              <Animated.View style={[styles.userCardContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                <Surface style={styles.userCard} elevation={4}>
                  <LinearGradient
                    colors={['#34495e', '#2c3e50']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.userCardGradient}
                  >
                    <View style={styles.userCardContent}>
                      <View style={styles.avatarContainer}>
                        {userData?.profileImage ? (
                          <Avatar.Image
                            size={70}
                            source={{ uri: userData.profileImage }}
                            style={styles.avatar}
                          />
                        ) : (
                          <Avatar.Text
                            size={70}
                            label={userData?.fullName?.charAt(0) || userData?.email?.charAt(0) || "P"}
                            color="#fff"
                            style={styles.avatar}
                            labelStyle={styles.avatarLabel}
                          />
                        )}
                        <View style={styles.avatarBorder} />
                      </View>
                      <View style={styles.userInfo}>
                        <Text style={styles.userName}>{userData?.fullName || "Producer"}</Text>
                        <Text style={styles.userEmail}>{userData?.email}</Text>
                        <Button
                          mode="contained"
                          onPress={() => navigation.navigate("ProfileScreen", { userData })}
                          style={styles.profileButton}
                          labelStyle={styles.profileButtonLabel}
                          icon="account-edit"
                        >
                          Edit Profile
                        </Button>
                      </View>
                    </View>
                  </LinearGradient>
                </Surface>
              </Animated.View>
            )}
          </View>

          <View style={styles.buttonContainer}>
            <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
              <Surface style={styles.buttonSurface} elevation={8}>
                <Button
                  mode="contained"
                  icon="package-variant"
                  contentStyle={styles.buttonContent}
                  style={styles.button}
                  labelStyle={styles.buttonLabel}
                  onPress={() => navigation.navigate("ProductManagement", { userData })}
                >
                  Manage Products
                </Button>
              </Surface>
            </Animated.View>

            <Animated.View
              style={{
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
                marginTop: 20
              }}
            >
              <Surface style={styles.buttonSurface} elevation={8}>
                <Button
                  mode="contained"
                  icon="clipboard-list"
                  contentStyle={styles.buttonContent}
                  style={styles.button}
                  labelStyle={styles.buttonLabel}
                  onPress={() => navigation.navigate("MyOrders")}
                >
                  Manage Orders
                </Button>
              </Surface>
            </Animated.View>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>© 2025 RawConnect</Text>
          </View>
        </LinearGradient>
      </ImageBackground>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundPattern: {
    flex: 1,
    width: '100%',
  },
  backgroundImage: {
    opacity: 0.15,
  },
  gradient: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    marginTop: 60,
    marginBottom: 30,
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFFFFF",
    letterSpacing: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 15,
    width: '80%',
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e67e22',
  },
  dividerIcon: {
    margin: 0,
  },
  userCardContainer: {
    width: '100%',
    paddingHorizontal: 5,
  },
  userCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 10,
  },
  userCardGradient: {
    borderRadius: 16,
    padding: 2,
  },
  userCardContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 15,
  },
  avatar: {
    backgroundColor: '#3498db',
  },
  avatarLabel: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  avatarBorder: {
    position: 'absolute',
    top: -3,
    left: -3,
    right: -3,
    bottom: -3,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: '#e67e22',
  },
  userInfo: {
    flex: 1,
    marginLeft: 5,
  },
  userName: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: "#ecf0f1",
    marginBottom: 12,
  },
  profileButton: {
    backgroundColor: "#e67e22",
    borderRadius: 8,
    marginTop: 5,
    elevation: 0,
  },
  profileButtonLabel: {
    fontSize: 12,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  buttonContainer: {
    flex: 1,
    justifyContent: "center",
    paddingBottom: 40,
  },
  buttonSurface: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  button: {
    backgroundColor: "#3498db",
    borderRadius: 16,
    elevation: 0,
  },
  buttonContent: {
    height: 100,
    justifyContent: "center",
  },
  buttonLabel: {
    fontSize: 18,
    fontWeight: "bold",
    letterSpacing: 0.5,
    color: "#FFFFFF",
  },
  footer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  footerText: {
    color: '#95a5a6',
    fontSize: 12,
  }
})

export default MainProducer
