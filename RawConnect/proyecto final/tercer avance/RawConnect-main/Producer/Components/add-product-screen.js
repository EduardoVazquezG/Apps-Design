"use client"

import { useNavigation, useRoute } from "@react-navigation/native"
import { LinearGradient } from "expo-linear-gradient"
import { addDoc, collection } from "firebase/firestore"
import { useState } from "react"
import { Alert, ScrollView, StyleSheet, View } from "react-native"
import {
    Button,
    Card,
    Chip,
    Divider,
    HelperText,
    IconButton,
    Menu,
    Text,
    TextInput,
    useTheme,
} from "react-native-paper"
import ImageUploader from "../../components/ImageUploader"
import { db } from "../../firebase/config"

const categories = ["Forestal", "Chemical", "Mineral", "Agricultural"]

const unitMeasures = [
    { label: "Units (ud)", value: "ud", category: "Quantity" },
    { label: "Box (box)", value: "box", category: "Quantity" },
    { label: "Pack (pack)", value: "pack", category: "Quantity" },
    { label: "Kilograms (kg)", value: "kg", category: "Weight" },
    { label: "Grams (g)", value: "g", category: "Weight" },
    { label: "Tons (t)", value: "t", category: "Weight" },
    { label: "Liters (L)", value: "L", category: "Volume" },
    { label: "Milliliters (ml)", value: "ml", category: "Volume" },
    { label: "Cubic meters (m³)", value: "m³", category: "Volume" },
    { label: "Meters (m)", value: "m", category: "Length" },
    { label: "Centimeters (cm)", value: "cm", category: "Length" },
    { label: "Millimeters (mm)", value: "mm", category: "Length" },
    { label: "Inches (in)", value: "in", category: "Length" },
    { label: "Feet (ft)", value: "ft", category: "Length" },
    { label: "Pallets", value: "pallets", category: "Industry" },
    { label: "Containers", value: "containers", category: "Industry" },
    { label: "Rolls", value: "rolls", category: "Industry" },
    { label: "Barrels", value: "barrels", category: "Industry" },
]

const AddProductScreen = () => {
    const route = useRoute();
    const { userData } = route.params;
    const theme = useTheme()
    const navigation = useNavigation()
    const [loading, setLoading] = useState(false)
    const [categoryMenuVisible, setCategoryMenuVisible] = useState(false)
    const [unitMenuVisible, setUnitMenuVisible] = useState(false)
    const [quantityError, setQuantityError] = useState("")

    const [product, setProduct] = useState({
        imageUrl: "",
        name: "",
        category: "",
        description: "",
        specifications: "",
        price: "",
        minimumOrder: "",
        deliveryOptions: "",
        unitMeasure: "",
        quantity: "",
    })

    const updateProduct = (field, value) => {
        if (field === "quantity") {
            setQuantityError("")

            const numValue = Number.parseFloat(value)
            if (value && (isNaN(numValue) || numValue <= 0)) {
                setQuantityError("Quantity must be a positive number")
            }
        }

        setProduct({ ...product, [field]: value })
    }

    const validateForm = () => {
        let isValid = true

        if (!product.name || !product.category || !product.price) {
            Alert.alert("Validation Error", "Name, category and price are required fields")
            isValid = false
        }

        if (!product.unitMeasure) {
            Alert.alert("Validation Error", "Please select a unit of measure")
            isValid = false
        }

        const quantity = Number.parseFloat(product.quantity)
        if (!product.quantity || isNaN(quantity) || quantity <= 0) {
            setQuantityError("Please enter a valid quantity greater than 0")
            isValid = false
        }

        return isValid
    }

    const handleSubmit = async () => {
        if (!validateForm()) return

        if (!userData.email) {
            Alert.alert("Error", "Vendedor no tiene un correo electrónico asociado.")
            return
        }

        try {
            setLoading(true)

            const productData = {
                ...product,
                price: Number.parseFloat(product.price),
                minimumOrder: Number.parseInt(product.minimumOrder, 10) || 1,
                quantity: Number.parseFloat(product.quantity),
                createdAt: new Date(),
                imageUrl: product.imageUrl,
                vendor: userData.email,
            }

            await addDoc(collection(db, "products"), productData)

            Alert.alert("Success", "Product added successfully", [{ text: "OK", onPress: () => navigation.goBack() }])
        } catch (error) {
            console.error("Error adding product:", error)
            Alert.alert("Error", "Failed to add product. Please try again.")
        } finally {
            setLoading(false)
        }
    }


    const groupedUnitMeasures = unitMeasures.reduce((acc, unit) => {
        if (!acc[unit.category]) {
            acc[unit.category] = []
        }
        acc[unit.category].push(unit)
        return acc
    }, {})

    return (
        <View style={styles.container}>
            <LinearGradient colors={["#2c3e50", "#1a2530"]} style={styles.header}>
                <IconButton
                    icon="arrow-left"
                    iconColor="#FFFFFF"
                    size={24}
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                />
                <Text style={styles.title}>Add New Product</Text>
            </LinearGradient>

            <ScrollView style={styles.form}>
                <Card style={styles.imageCard}>
                    <Card.Content style={styles.imageCardContent}>
                        <Text style={styles.sectionTitle}>Product Image</Text>
                        <ImageUploader uploadPreset="rawcn_products" onUploadComplete={(url) => updateProduct("imageUrl", url)} />
                    </Card.Content>
                </Card>

                <Text style={styles.sectionTitle}>Basic Information</Text>
                <Card style={styles.card}>
                    <Card.Content>
                        <TextInput
                            label="Product Name"
                            value={product.name}
                            onChangeText={(text) => updateProduct("name", text)}
                            mode="outlined"
                            style={styles.input}
                            outlineColor="#2c3e50"
                            activeOutlineColor="#34495e"
                            left={<TextInput.Icon icon="tag" />}
                        />

                        <View style={styles.inputContainer}>
                            <TextInput
                                label="Category"
                                value={product.category}
                                onChangeText={(text) => updateProduct("category", text)}
                                mode="outlined"
                                style={styles.input}
                                outlineColor="#2c3e50"
                                activeOutlineColor="#34495e"
                                left={<TextInput.Icon icon="shape" />}
                                right={<TextInput.Icon icon="menu-down" onPress={() => setCategoryMenuVisible(true)} />}
                            />
                            <Menu
                                visible={categoryMenuVisible}
                                onDismiss={() => setCategoryMenuVisible(false)}
                                anchor={{ x: 0, y: 0 }}
                                style={styles.menu}
                            >
                                {categories.map((category) => (
                                    <Menu.Item
                                        key={category}
                                        onPress={() => {
                                            updateProduct("category", category)
                                            setCategoryMenuVisible(false)
                                        }}
                                        title={category}
                                    />
                                ))}
                            </Menu>
                            <View style={styles.chipContainer}>
                                {categories.map((category) => (
                                    <Chip
                                        key={category}
                                        selected={product.category === category}
                                        onPress={() => updateProduct("category", category)}
                                        style={[styles.chip, product.category === category && { backgroundColor: "#eaecee" }]}
                                        textStyle={product.category === category ? { color: "#2c3e50" } : {}}
                                    >
                                        {category}
                                    </Chip>
                                ))}
                            </View>
                        </View>

                        <TextInput
                            label="Description"
                            value={product.description}
                            onChangeText={(text) => updateProduct("description", text)}
                            mode="outlined"
                            style={styles.input}
                            outlineColor="#2c3e50"
                            activeOutlineColor="#34495e"
                            multiline
                            numberOfLines={3}
                            left={<TextInput.Icon icon="text" />}
                        />
                    </Card.Content>
                </Card>

                <Text style={styles.sectionTitle}>Product Details</Text>
                <Card style={styles.card}>
                    <Card.Content>
                        <TextInput
                            label="Specifications"
                            value={product.specifications}
                            onChangeText={(text) => updateProduct("specifications", text)}
                            mode="outlined"
                            style={styles.input}
                            outlineColor="#2c3e50"
                            activeOutlineColor="#34495e"
                            multiline
                            numberOfLines={3}
                            left={<TextInput.Icon icon="clipboard-list" />}
                        />

                        <View style={styles.row}>
                            <TextInput
                                label="Price"
                                value={product.price}
                                onChangeText={(text) => updateProduct("price", text)}
                                mode="outlined"
                                style={[styles.input, styles.halfInput]}
                                outlineColor="#2c3e50"
                                activeOutlineColor="#34495e"
                                keyboardType="numeric"
                                left={<TextInput.Icon icon="currency-usd" />}
                            />

                            <TextInput
                                label="Minimum Order"
                                value={product.minimumOrder}
                                onChangeText={(text) => updateProduct("minimumOrder", text)}
                                mode="outlined"
                                style={[styles.input, styles.halfInput]}
                                outlineColor="#2c3e50"
                                activeOutlineColor="#34495e"
                                keyboardType="numeric"
                                left={<TextInput.Icon icon="package-variant" />}
                            />
                        </View>

                        <View style={styles.row}>
                            <View style={[styles.halfInput, { marginRight: 8 }]}>
                                <TextInput
                                    label="Quantity in Stock *"
                                    value={product.quantity}
                                    onChangeText={(text) => updateProduct("quantity", text)}
                                    mode="outlined"
                                    style={styles.input}
                                    outlineColor={quantityError ? "#F44336" : "#2c3e50"}
                                    activeOutlineColor={quantityError ? "#F44336" : "#34495e"}
                                    keyboardType="numeric"
                                    left={<TextInput.Icon icon="counter" />}
                                    error={!!quantityError}
                                />
                                {quantityError ? <HelperText type="error">{quantityError}</HelperText> : null}
                            </View>

                            <View style={styles.halfInput}>
                                <TextInput
                                    label="Unit of Measure *"
                                    value={
                                        product.unitMeasure
                                            ? unitMeasures.find((u) => u.value === product.unitMeasure)?.label || product.unitMeasure
                                            : ""
                                    }
                                    mode="outlined"
                                    style={styles.input}
                                    outlineColor="#2c3e50"
                                    activeOutlineColor="#34495e"
                                    left={<TextInput.Icon icon="scale" />}
                                    right={<TextInput.Icon icon="menu-down" onPress={() => setUnitMenuVisible(true)} />}
                                    editable={false}
                                />
                                <Menu
                                    visible={unitMenuVisible}
                                    onDismiss={() => setUnitMenuVisible(false)}
                                    anchor={{ x: 0, y: 0 }}
                                    style={styles.unitMenu}
                                >
                                    {Object.entries(groupedUnitMeasures).map(([category, units]) => (
                                        <View key={category}>
                                            <Menu.Item title={category} disabled titleStyle={styles.menuCategoryTitle} />
                                            <Divider />
                                            {units.map((unit) => (
                                                <Menu.Item
                                                    key={unit.value}
                                                    onPress={() => {
                                                        updateProduct("unitMeasure", unit.value)
                                                        setUnitMenuVisible(false)
                                                    }}
                                                    title={unit.label}
                                                />
                                            ))}
                                            {category !== Object.keys(groupedUnitMeasures).pop() && <Divider bold />}
                                        </View>
                                    ))}
                                </Menu>
                            </View>
                        </View>

                        <TextInput
                            label="Delivery Options"
                            value={product.deliveryOptions}
                            onChangeText={(text) => updateProduct("deliveryOptions", text)}
                            mode="outlined"
                            style={styles.input}
                            outlineColor="#2c3e50"
                            activeOutlineColor="#34495e"
                            multiline
                            numberOfLines={2}
                            left={<TextInput.Icon icon="truck" />}
                        />
                    </Card.Content>
                </Card>

                <Button
                    mode="contained"
                    onPress={handleSubmit}
                    style={styles.submitButton}
                    loading={loading}
                    disabled={loading}
                    icon="check"
                >
                    Add Product
                </Button>
            </ScrollView>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F5F5F5",
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        padding: 20,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
        elevation: 4,
    },
    backButton: {
        backgroundColor: "rgba(255, 255, 255, 0.2)",
        margin: 0,
    },
    title: {
        fontSize: 24,
        fontWeight: "bold",
        color: "#FFFFFF",
        marginLeft: 10,
    },
    form: {
        flex: 1,
        padding: 16,
    },
    card: {
        marginBottom: 16,
        borderRadius: 12,
        elevation: 2,
        backgroundColor: "#FFFFFF",
    },
    imageCard: {
        marginBottom: 16,
        borderRadius: 12,
        elevation: 2,
        backgroundColor: "#FFFFFF",
    },
    imageCardContent: {
        alignItems: "center",
        padding: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#2c3e50",
        marginTop: 16,
        marginBottom: 8,
        marginLeft: 4,
    },
    inputContainer: {
        marginBottom: 15,
    },
    input: {
        marginBottom: 5,
        backgroundColor: "#FFFFFF",
    },
    row: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
    },
    halfInput: {
        flex: 1,
    },
    menu: {
        marginTop: 70,
    },
    unitMenu: {
        marginTop: 70,
        width: 250,
    },
    menuCategoryTitle: {
        fontWeight: "bold",
        color: "#2c3e50",
    },
    chipContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        marginBottom: 10,
    },
    chip: {
        margin: 4,
        backgroundColor: "#f5f7fa",
    },
    submitButton: {
        marginTop: 20,
        marginBottom: 40,
        backgroundColor: "#2c3e50",
        paddingVertical: 8,
        borderRadius: 12,
        elevation: 4,
    },
})

export default AddProductScreen