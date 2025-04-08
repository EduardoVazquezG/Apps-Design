import { Ionicons } from "@expo/vector-icons"
import { collection, getDocs, query, where } from "firebase/firestore"
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
    TextInput,
    TouchableOpacity,
    View
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

export default function MyProducts({ navigation, route }) {
    const { userData } = route.params;

    const [products, setProducts] = useState([])
    const [filteredProducts, setFilteredProducts] = useState([])
    const [loading, setLoading] = useState(true)
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
                product.name.toLowerCase().includes(lowercasedSearchText) ||
                product.category.toLowerCase().includes(lowercasedSearchText)
            )
            setFilteredProducts(filtered)
        }
    }, [searchText, products])

    const fetchProducts = async (category) => {
        try {
            setLoading(true)
            const productsCollection = collection(db, "products")

            let q
            if (category === "All") {
                q = query(productsCollection, where("vendor", "==", userData.email))

            }

            const querySnapshot = await getDocs(q)



            const productsList = querySnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
                rating: doc.data().rating || 4.5,
            }))



            setProducts(productsList)
            setFilteredProducts(productsList)
        } catch (error) {
            console.error("Error fetching products:", error)
        } finally {
            setLoading(false)
        }
    }

    const renderStars = (rating) => {
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
                <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
            </View>
        )
    }

    const navigateToEditProduct = (product) => {
        navigation.navigate("EditProduct", { product })
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
                { }
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
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.productsContainer}>
                    {filteredProducts.length > 0 ? (
                        <>


                            <View style={styles.allProductsContainer}>
                                <Text style={styles.sectionTitle}>
                                    {selectedCategory === "All" ? "All Products" : `${selectedCategory} Products`}
                                </Text>
                                <View style={styles.productsGrid}>
                                    {filteredProducts.map((product) => (
                                        <TouchableOpacity
                                            key={product.id}
                                            style={styles.productCard}
                                            onPress={() => navigateToEditProduct(product)}
                                        >
                                            {product.imageUrl ? (
                                                <Image source={{ uri: product.imageUrl }} style={styles.productImage} />
                                            ) : (
                                                <View style={styles.productImagePlaceholder}>
                                                    <Ionicons name="image-outline" size={30} color={COLORS.white} />
                                                </View>
                                            )}
                                            <View style={styles.productInfo}>
                                                <Text style={styles.productName} numberOfLines={1}>
                                                    {product.name}
                                                </Text>
                                                <Text style={styles.productPrice}>${product.price}</Text>
                                                {renderStars(product.rating)}
                                            </View>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        </>
                    ) : (
                        <View style={styles.noProductsContainer}>
                            <Ionicons name="alert-circle-outline" size={60} color={COLORS.gray} />
                            <Text style={styles.noProductsText}>No products available in this category</Text>
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
        justifyContent: "space-between",
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
    },
    headerTitle: {
        fontSize: 24,
        marginRight: '30%',
        fontWeight: "bold",
        color: COLORS.text,
        textAlign: "center",
    },
    headerSubtitle: {
        fontSize: 14,
        marginRight: '30%',
        color: COLORS.textLight,
        marginTop: 2,
        textAlign: "center",
    },
    searchButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.lightGray,
        justifyContent: "center",
        alignItems: "center",
    },
    searchContainer: {
        paddingHorizontal: 20,
        marginVertical: 10,
        width: '95%',
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
    categoriesContainer: {
        paddingVertical: 10,
        backgroundColor: COLORS.white,
    },
    categoriesScrollView: {
        paddingHorizontal: 15,
    },
    categoryButton: {
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 20,
        marginRight: 10,
        backgroundColor: COLORS.lightGray,
    },
    categoryButtonActive: {
        backgroundColor: COLORS.primary,
    },
    categoryButtonText: {
        fontSize: 14,
        fontWeight: "500",
        color: COLORS.textLight,
    },
    categoryButtonTextActive: {
        color: COLORS.white,
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
    featuredContainer: {
        marginTop: 15,
    },
    featuredScrollView: {
        paddingLeft: 20,
        paddingRight: 5,
    },
    featuredProductCard: {
        width: width * 0.7,
        marginRight: 15,
        borderRadius: 12,
        backgroundColor: COLORS.white,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
        overflow: "hidden",
    },
    productImage: {
        height: 150,
        width: "100%",
        borderTopLeftRadius: 12,
        borderTopRightRadius: 12,
    },
    productImagePlaceholder: {
        height: 150,
        backgroundColor: COLORS.secondary,
        justifyContent: "center",
        alignItems: "center",
        borderTopLeftRadius: 12,
        borderTopRightRadius: 12,
    },
    featuredProductInfo: {
        padding: 15,
    },
    productCategory: {
        fontSize: 12,
        color: COLORS.primary,
        fontWeight: "600",
        marginBottom: 5,
    },
    featuredProductName: {
        fontSize: 16,
        fontWeight: "bold",
        color: COLORS.text,
        marginBottom: 5,
    },
    featuredProductPrice: {
        fontSize: 18,
        fontWeight: "bold",
        color: COLORS.accent,
        marginBottom: 8,
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
})

