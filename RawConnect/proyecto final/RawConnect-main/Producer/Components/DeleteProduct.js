import { Ionicons } from "@expo/vector-icons"
import { collection, getDocs, query, where, doc, deleteDoc } from "firebase/firestore"
import { useEffect, useState } from "react"
import {
    ActivityIndicator,
    Dimensions,
    Image,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    TextInput,
    Alert,
    RefreshControl
} from "react-native"
import { db } from "../../config/fb"

const COLORS = {
    primary: "#00BCD4",
    secondary: "#80DEEA",
    accent: "#0097A7",
    white: "#FFFFFF",
    lightGray: "#F5F5F5",
    gray: "#9E9E9E",
    text: "#263238",
    textLight: "#546E7A",
}
const { width } = Dimensions.get("window")

export default function DeleteProduct({ navigation, route }) {
    const { userData } = route.params;
    const [products, setProducts] = useState([])
    const [filteredProducts, setFilteredProducts] = useState([])
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [searchText, setSearchText] = useState("")
    const initialCategory = route.params?.initialCategory || "All"
    const [selectedCategory, setSelectedCategory] = useState(initialCategory)
    const categories = ["All"]

    useEffect(() => {
        if (route.params?.initialCategory) {
            setSelectedCategory(route.params.initialCategory)
        }
    }, [route.params?.initialCategory])

    useEffect(() => {
        fetchProducts(selectedCategory)
    }, [selectedCategory])

    useEffect(() => {
        if (searchText.trim() === "") {
            setFilteredProducts(products)
        } else {
            const lowercasedSearchText = searchText.toLowerCase()
            const filtered = products.filter((product) =>
                product?.name?.toLowerCase().includes(lowercasedSearchText) ||
                product?.category?.toLowerCase().includes(lowercasedSearchText)
            )
            setFilteredProducts(filtered)
        }
    }, [searchText, products])

    const fetchProducts = async (category) => {
        try {
            setLoading(true)
            const productsCollection = collection(db, "products")
            let q = query(productsCollection, where("vendor", "==", userData.email))

            const querySnapshot = await getDocs(q)
            
            const productsList = querySnapshot.docs.map((doc) => {
                const data = doc.data()
                return {
                    id: doc.id,
                    name: data.name || "Unnamed Product",
                    price: data.price || 0,
                    category: data.category || "Uncategorized",
                    imageUrl: data.imageUrl || null,
                    rating: data.rating || 4.5,
                    minimumOrder: data.minimumOrder || 1,
                    quantity: data.quantity || 0,
                    unitMeasure: data.unitMeasure || "ud",
                    ...data
                }
            })

            setProducts(productsList)
            setFilteredProducts(productsList)
        } catch (error) {
            console.error("Error fetching products:", {
                error: error.message,
                userEmail: userData?.email,
                category
            })
            Alert.alert("Error", "Failed to load products. Please try again later.")
        } finally {
            setLoading(false)
        }
    }

    const onRefresh = async () => {
        setRefreshing(true)
        await fetchProducts(selectedCategory)
        setRefreshing(false)
    }

    const handleDeleteProduct = async (productId) => {
        try {
            setLoading(true)
            await deleteDoc(doc(db, "products", productId))
            Alert.alert("Success", "Product deleted successfully")
            fetchProducts(selectedCategory) // Refresh the list
        } catch (error) {
            console.error("Error deleting product:", error)
            Alert.alert("Error", "Failed to delete product. Please try again.")
        } finally {
            setLoading(false)
        }
    }

    const confirmDelete = (product) => {
        Alert.alert(
            "Delete Product",
            `Are you sure you want to delete "${product.name}"?`,
            [
                {
                    text: "Cancel",
                    style: "cancel"
                },
                { 
                    text: "Delete", 
                    style: "destructive",
                    onPress: () => handleDeleteProduct(product.id)
                }
            ]
        )
    }

    const renderStars = (rating = 0) => {
        const stars = []
        const fullStars = Math.floor(rating)
        const halfStar = rating - fullStars >= 0.5

        for (let i = 0; i < 5; i++) {
            if (i < fullStars) {
                stars.push(<Ionicons key={i} name="star" size={14} color={COLORS.primary} />)
            } else if (i === fullStars && halfStar) {
                stars.push(<Ionicons key={i} name="star-half" size={14} color={COLORS.primary} />)
            } else {
                stars.push(<Ionicons key={i} name="star-outline" size={14} color={COLORS.primary} />)
            }
        }

        return (
            <View style={styles.ratingContainer}>
                {stars}
                <Text style={styles.ratingText}>{rating?.toFixed(1)}</Text>
            </View>
        )
    }

    useEffect(() => {
        navigation.setOptions({
            title: selectedCategory === "All" ? "My Products" : `${selectedCategory} Products`,
        })
    }, [selectedCategory, navigation])

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar backgroundColor={COLORS.white} barStyle="dark-content" />

            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.text} />
                </TouchableOpacity>
                <View style={styles.searchContainer}>
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search products"
                        value={searchText}
                        onChangeText={setSearchText}
                    />
                </View>
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                    <Text style={styles.loadingText}>Loading products...</Text>
                </View>
            ) : (
                <ScrollView 
                    showsVerticalScrollIndicator={false} 
                    contentContainerStyle={styles.productsContainer}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={[COLORS.primary]}
                        />
                    }
                >
                    {filteredProducts.length > 0 ? (
                        <View style={styles.allProductsContainer}>
                            <Text style={styles.sectionTitle}>
                                {selectedCategory === "All" ? "All Products" : `${selectedCategory} Products`}
                            </Text>
                            <View style={styles.productsGrid}>
                                {filteredProducts.map((product) => (
                                    <TouchableOpacity
                                        key={product.id}
                                        style={styles.productCard}
                                        onPress={() => confirmDelete(product)}
                                        onLongPress={() => navigation.navigate("EditProduct", { product, userData })}
                                    >
                                        {product?.imageUrl ? (
                                            <Image 
                                                source={{ uri: product.imageUrl }} 
                                                style={styles.productImage} 
                                                resizeMode="cover"
                                            />
                                        ) : (
                                            <View style={styles.productImagePlaceholder}>
                                                <Ionicons name="image-outline" size={30} color={COLORS.white} />
                                            </View>
                                        )}
                                        <View style={styles.productInfo}>
                                            <Text style={styles.productName} numberOfLines={1}>
                                                {product?.name || "Unnamed Product"}
                                            </Text>
                                            <Text style={styles.productPrice}>
                                                ${product?.price?.toFixed(2) || "0.00"}
                                            </Text>
                                            {renderStars(product?.rating)}
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    ) : (
                        <View style={styles.noProductsContainer}>
                            <Ionicons name="alert-circle-outline" size={60} color={COLORS.gray} />
                            <Text style={styles.noProductsText}>No products found</Text>
                        </View>
                    )}
                </ScrollView>
            )}
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.white,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingTop: 15,
        paddingBottom: 10,
        backgroundColor: COLORS.white,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.lightGray,
        justifyContent: "center",
        alignItems: "center",
        marginRight: 10,
    },
    searchContainer: {
        flex: 1,
    },
    searchInput: {
        height: 40,
        borderColor: COLORS.gray,
        borderWidth: 1,
        borderRadius: 10,
        paddingHorizontal: 10,
        fontSize: 16,
        color: COLORS.text,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: COLORS.textLight,
    },
    productsContainer: {
        paddingBottom: 20,
    },
    noProductsContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingTop: 100,
    },
    noProductsText: {
        fontSize: 16,
        color: COLORS.gray,
        marginTop: 10,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: COLORS.text,
        marginBottom: 15,
        paddingHorizontal: 20,
    },
    allProductsContainer: {
        marginTop: 25,
    },
    productsGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
        paddingHorizontal: 20,
    },
    productCard: {
        width: (width - 50) / 2,
        marginBottom: 15,
        borderRadius: 12,
        backgroundColor: COLORS.white,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 3,
        overflow: "hidden",
    },
    productImage: {
        height: 150,
        width: "100%",
    },
    productImagePlaceholder: {
        height: 150,
        backgroundColor: COLORS.secondary,
        justifyContent: "center",
        alignItems: "center",
    },
    productInfo: {
        padding: 10,
    },
    productName: {
        fontSize: 14,
        fontWeight: "600",
        color: COLORS.text,
        marginBottom: 5,
    },
    productPrice: {
        fontSize: 16,
        fontWeight: "bold",
        color: COLORS.accent,
        marginBottom: 5,
    },
    ratingContainer: {
        flexDirection: "row",
        alignItems: "center",
    },
    ratingText: {
        marginLeft: 5,
        fontSize: 12,
        color: COLORS.textLight,
    },
})