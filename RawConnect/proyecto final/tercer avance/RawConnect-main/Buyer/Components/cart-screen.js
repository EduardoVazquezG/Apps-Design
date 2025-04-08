"use client"

import { useNavigation } from "@react-navigation/native"
import { useEffect, useState } from "react"
import {
    ActivityIndicator,
    Alert,
    Image,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    TouchableOpacity,
    View,
} from "react-native"
import { Button, Card, Divider, HelperText, IconButton, Modal, Portal, Text, TextInput } from "react-native-paper"
import Icon from "react-native-vector-icons/MaterialCommunityIcons"
import {
    addDoc,
    auth,
    collection,
    db,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    query,
    setDoc,
    updateDoc,
    where,
} from "../../config/fb"
import PayPalCheckout from "./PayPalCheckout"

const CartScreen = () => {
    const navigation = useNavigation()
    const [cartItems, setCartItems] = useState([])
    const [loading, setLoading] = useState(true)
    const [totalPrice, setTotalPrice] = useState(0)
    const [checkoutModalVisible, setCheckoutModalVisible] = useState(false)
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null)
    const [paymentInfo, setPaymentInfo] = useState({
        cardNumber: "",
        cardHolder: "",
        expiryDate: "",
        cvv: "",
    })
    const [savedCard, setSavedCard] = useState(null)
    const [useStoredCard, setUseStoredCard] = useState(false)
    const [errors, setErrors] = useState({})
    const [processingPayment, setProcessingPayment] = useState(false)

    const handlePaymentSuccess = () => {
        setCartItems([])
        Alert.alert('Éxito', 'Tu pedido ha sido realizado.')
    };

    const handlePaymentCancel = () => {
        console.log('Pago cancelado')
    };

    useEffect(() => {
        fetchCartItems()
        fetchSavedCardInfo()
        const unsubscribeFocus = navigation.addListener("focus", () => {
            fetchCartItems()
            fetchSavedCardInfo()
        })
        return unsubscribeFocus
    }, [navigation])

    useEffect(() => {
        const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
        setTotalPrice(total)
    }, [cartItems])

    const fetchSavedCardInfo = async () => {
        try {
            if (!auth.currentUser) return
            const userEmail = auth.currentUser.email
            const cardDocRef = doc(db, "userPaymentMethods", userEmail)
            const cardDoc = await getDoc(cardDocRef)
            if (cardDoc.exists()) {
                const cardData = cardDoc.data()
                setSavedCard(cardData)
                setPaymentInfo({
                    cardNumber: cardData.cardNumber || "",
                    cardHolder: cardData.cardHolder || "",
                    expiryDate: cardData.expiryDate || "",
                    cvv: "",
                })
                setUseStoredCard(true)
            } else {
                setSavedCard(null)
                setUseStoredCard(false)
                setPaymentInfo({
                    cardNumber: "",
                    cardHolder: "",
                    expiryDate: "",
                    cvv: "",
                })
            }
        } catch (error) {
            console.error("Error fetching saved card:", error)
            setSavedCard(null)
            setUseStoredCard(false)
        }
    }

    const fetchCartItems = async () => {
        try {
            setLoading(true)
            if (!auth.currentUser) {
                Alert.alert("Error", "You must be logged in to view your cart")
                navigation.navigate("Login")
                return
            }
            const userEmail = auth.currentUser.email
            const cartQuery = query(collection(db, "cart"), where("userEmail", "==", userEmail))
            const querySnapshot = await getDocs(cartQuery)
            const items = []
            querySnapshot.forEach((doc) => {
                items.push({ id: doc.id, ...doc.data() })
            })
            console.log("Cart items fetched:", items.length)
            setCartItems(items)
        } catch (error) {
            console.error("Error fetching cart items:", error)
            Alert.alert("Error", "Failed to load cart items")
        } finally {
            setLoading(false)
        }
    }

    const handleRemoveItem = async (itemId) => {
        try {
            await deleteDoc(doc(db, "cart", itemId))
            setCartItems(cartItems.filter((item) => item.id !== itemId))
            Alert.alert("Success", "Item removed from cart")
        } catch (error) {
            console.error("Error removing item from cart:", error)
            Alert.alert("Error", "Failed to remove item from cart")
        }
    }

    const handleUpdateQuantity = async (itemId, newQuantity) => {
        if (newQuantity < 1) return
        try {
            const itemIndex = cartItems.findIndex((item) => item.id === itemId)
            if (itemIndex === -1) return
            const item = cartItems[itemIndex]
            if (newQuantity > item.productStock) {
                Alert.alert("Error", `Only ${item.productStock} units available in stock`)
                return
            }
            await updateDoc(doc(db, "cart", itemId), { quantity: newQuantity })
            const updatedItems = [...cartItems]
            updatedItems[itemIndex] = { ...item, quantity: newQuantity }
            setCartItems(updatedItems)
        } catch (error) {
            console.error("Error updating quantity:", error)
            Alert.alert("Error", "Failed to update quantity")
        }
    }

    const validatePaymentInfo = () => {
        const newErrors = {}
        if (useStoredCard) {
            if (!paymentInfo.cvv.trim() || paymentInfo.cvv.length < 3) {
                newErrors.cvv = "Please enter a valid CVV"
            }
        } else {
            if (!paymentInfo.cardNumber.trim() || paymentInfo.cardNumber.length < 16) {
                newErrors.cardNumber = "Please enter a valid 16-digit card number"
            }
            if (!paymentInfo.cardHolder.trim()) {
                newErrors.cardHolder = "Please enter the cardholder name"
            }
            if (!paymentInfo.expiryDate.trim() || !paymentInfo.expiryDate.includes("/")) {
                newErrors.expiryDate = "Please enter a valid expiry date (MM/YY)"
            } else {
                const [month, year] = paymentInfo.expiryDate.split("/")
                const currentYear = new Date().getFullYear() % 100
                const currentMonth = new Date().getMonth() + 1
                if (
                    Number.parseInt(year) < currentYear ||
                    (Number.parseInt(year) === currentYear && Number.parseInt(month) < currentMonth) ||
                    Number.parseInt(month) > 12 ||
                    Number.parseInt(month) < 1
                ) {
                    newErrors.expiryDate = "Card has expired or date is invalid"
                }
            }
            if (!paymentInfo.cvv.trim() || paymentInfo.cvv.length < 3) {
                newErrors.cvv = "Please enter a valid CVV"
            }
        }
        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const saveCardInformation = async () => {
        try {
            if (!auth.currentUser) return
            const userEmail = auth.currentUser.email
            const cardDocRef = doc(db, "userPaymentMethods", userEmail)
            await setDoc(cardDocRef, {
                cardNumber: paymentInfo.cardNumber,
                cardHolder: paymentInfo.cardHolder,
                expiryDate: paymentInfo.expiryDate,
                lastFour: paymentInfo.cardNumber.slice(-4),
                updatedAt: new Date(),
            })
            console.log("Card information saved successfully")
        } catch (error) {
            console.error("Error saving card information:", error)
        }
    }

    const handleCheckout = async () => {
        if (!validatePaymentInfo()) return
        try {
            setProcessingPayment(true)
            if (cartItems.length === 0) {
                Alert.alert("Error", "Your cart is empty")
                return
            }
            if (!useStoredCard) {
                await saveCardInformation()
            }
            const itemsByVendor = {}
            cartItems.forEach((item) => {
                if (!itemsByVendor[item.vendorEmail]) {
                    itemsByVendor[item.vendorEmail] = []
                }
                itemsByVendor[item.vendorEmail].push(item)
            })
            for (const vendorEmail in itemsByVendor) {
                const vendorItems = itemsByVendor[vendorEmail]
                const vendorTotal = vendorItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
                await addDoc(collection(db, "orders"), {
                    buyerEmail: auth.currentUser.email,
                    vendorEmail: vendorEmail,
                    items: vendorItems.map((item) => ({
                        productId: item.productId,
                        productName: item.productName,
                        quantity: item.quantity,
                        price: item.price,
                        unitMeasure: item.unitMeasure,
                    })),
                    totalAmount: vendorTotal,
                    status: "pending",
                    paymentMethod: "Credit Card",
                    createdAt: new Date(),
                    paymentDetails: {
                        cardLast4: useStoredCard ? savedCard.lastFour : paymentInfo.cardNumber.slice(-4),
                        cardHolder: useStoredCard ? savedCard.cardHolder : paymentInfo.cardHolder,
                    },
                })
                for (const item of vendorItems) {
                    const productRef = doc(db, "products", item.productId)
                    await updateDoc(productRef, { quantity: item.productStock - item.quantity })
                }
            }
            for (const item of cartItems) {
                await deleteDoc(doc(db, "cart", item.id))
            }
            setCartItems([])
            setCheckoutModalVisible(false)
            setSelectedPaymentMethod(null)
            Alert.alert(
                "Order Placed Successfully",
                "Your order has been placed and is pending approval from the vendor.",
                [
                    { text: "View My Orders", onPress: () => navigation.navigate("MyOrders") },
                    { text: "Continue Shopping", onPress: () => navigation.navigate("Home") },
                ]
            )
        } catch (error) {
            console.error("Error processing checkout:", error)
            Alert.alert("Error", "Failed to process your order. Please try again.")
        } finally {
            setProcessingPayment(false)
        }
    }

    const handlePayPalPaymentSuccess = async (paymentDetails) => {
        try {
            setProcessingPayment(true);
            if (cartItems.length === 0) {
                Alert.alert("Error", "Your cart is empty");
                return;
            }

            const details = paymentDetails.data ? paymentDetails.data : paymentDetails;
            console.log("Detalles de pago:", details);

            const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
            const userData = userDoc.data();

            const itemsByVendor = groupItemsByVendor();

            for (const vendorEmail in itemsByVendor) {
                const vendorItems = itemsByVendor[vendorEmail];
                const vendorTotal = vendorItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

                await createOrder({
                    vendorEmail,
                    vendorItems,
                    vendorTotal,
                    paymentMethod: "PayPal",
                    paymentDetails: {
                        transactionId: details.id,
                        payerEmail: details.payer?.email_address,
                        amount: details.total
                    }
                });
            }

            await clearCart();
            showSuccessAlert();

        } catch (error) {
            console.error("Error procesando pago PayPal:", error);
            Alert.alert("Error", "No se pudo completar la transacción");
        } finally {
            setProcessingPayment(false);
        }
    };


    const groupItemsByVendor = () => {
        return cartItems.reduce((acc, item) => {
            if (!acc[item.vendorEmail]) acc[item.vendorEmail] = [];
            acc[item.vendorEmail].push(item);
            return acc;
        }, {});
    };

    const createOrder = async (orderData) => {
        const orderRef = await addDoc(collection(db, "orders"), {
            buyerId: auth.currentUser.uid,
            buyerEmail: auth.currentUser.email,
            ...orderData,
            status: "pending",
            createdAt: new Date(),
        });

        await Promise.all(orderData.vendorItems.map(async (item) => {
            const productRef = doc(db, "products", item.productId);
            await updateDoc(productRef, {
                quantity: item.productStock - item.quantity
            });
        }));

        return orderRef;
    };

    const clearCart = async () => {
        await Promise.all(cartItems.map(item =>
            deleteDoc(doc(db, "cart", item.id))
        ));
        setCartItems([]);
    };

    const showSuccessAlert = () => {
        setCheckoutModalVisible(false);
        Alert.alert(
            "¡Pago exitoso!",
            "Tu orden ha sido procesada correctamente",
            [
                {
                    text: "Ver órdenes",
                    onPress: () => navigation.navigate("MyOrders")
                },
                {
                    text: "Seguir comprando",
                    onPress: () => navigation.navigate("Home")
                }
            ]
        );
    };

    const handlePayPalPaymentError = (error) => {
        Alert.alert("Payment Error", "An error occurred during the PayPal payment. Please try again.")
        console.error("PayPal Payment Error:", error)
    };

    const formatCardNumber = (text) => {
        const cleaned = text.replace(/\D/g, "")
        const trimmed = cleaned.substring(0, 16)
        const formatted = trimmed.replace(/(\d{4})(?=\d)/g, "$1 ")
        setPaymentInfo({ ...paymentInfo, cardNumber: formatted })
    };

    const formatExpiryDate = (text) => {
        const cleaned = text.replace(/\D/g, "")
        const trimmed = cleaned.substring(0, 4)
        if (trimmed.length > 2) {
            const formatted = `${trimmed.substring(0, 2)}/${trimmed.substring(2)}`
            setPaymentInfo({ ...paymentInfo, expiryDate: formatted })
        } else {
            setPaymentInfo({ ...paymentInfo, expiryDate: trimmed })
        }
    };

    const renderEmptyCart = () => (
        <View style={styles.emptyCartContainer}>
            <Icon name="cart-off" size={80} color="#6bb2db" />
            <Text style={styles.emptyCartText}>Your cart is empty</Text>
            <Button mode="contained" style={styles.shopButton} onPress={() => navigation.navigate("Home")}>
                Start Shopping
            </Button>
        </View>
    );

    const toggleUseStoredCard = () => {
        setUseStoredCard(!useStoredCard)
        setErrors({})
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#6bb2db" />
                <Text style={styles.loadingText}>Loading your cart...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <IconButton icon="arrow-left" iconColor="#FFFFFF" size={24} onPress={() => navigation.goBack()} />
                <Text style={styles.title}>Shopping Cart</Text>
                <View style={{ width: 40 }} />
            </View>

            {cartItems.length === 0 ? (
                renderEmptyCart()
            ) : (
                <>
                    <ScrollView style={styles.cartItemsContainer}>
                        {cartItems.map((item) => (
                            <Card key={item.id} style={styles.cartItemCard}>
                                <Card.Content style={styles.cartItemContent}>
                                    <View style={styles.productImageContainer}>
                                        {item.imageUrl ? (
                                            <Image source={{ uri: item.imageUrl }} style={styles.productImage} />
                                        ) : (
                                            <View style={styles.productImagePlaceholder}>
                                                <Icon name="image-off" size={30} color="#FFFFFF" />
                                            </View>
                                        )}
                                    </View>
                                    <View style={styles.productDetails}>
                                        <Text style={styles.productName}>{item.productName}</Text>
                                        <Text style={styles.productVendor}>Seller: {item.vendorEmail}</Text>
                                        <Text style={styles.productPrice}>${item.price.toFixed(2)}</Text>
                                        <View style={styles.quantityContainer}>
                                            <TouchableOpacity
                                                style={styles.quantityButton}
                                                onPress={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                                            >
                                                <Icon name="minus" size={16} color="#6bb2db" />
                                            </TouchableOpacity>
                                            <Text style={styles.quantityText}>{item.quantity}</Text>
                                            <TouchableOpacity
                                                style={styles.quantityButton}
                                                onPress={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                                            >
                                                <Icon name="plus" size={16} color="#6bb2db" />
                                            </TouchableOpacity>
                                            <Text style={styles.unitText}>{item.unitMeasure}</Text>
                                        </View>
                                    </View>
                                    <IconButton
                                        icon="delete"
                                        iconColor="#D32F2F"
                                        size={20}
                                        onPress={() => handleRemoveItem(item.id)}
                                        style={styles.removeButton}
                                    />
                                </Card.Content>
                            </Card>
                        ))}
                    </ScrollView>

                    <Card style={styles.summaryCard}>
                        <Card.Content>
                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryLabel}>Subtotal</Text>
                                <Text style={styles.summaryValue}>${totalPrice.toFixed(2)}</Text>
                            </View>
                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryLabel}>Shipping</Text>
                                <Text style={styles.summaryValue}>$0.00</Text>
                            </View>
                            <Divider style={styles.divider} />
                            <View style={styles.summaryRow}>
                                <Text style={styles.totalLabel}>Total</Text>
                                <Text style={styles.totalValue}>${totalPrice.toFixed(2)}</Text>
                            </View>
                            <Button mode="contained" style={styles.checkoutButton} onPress={() => setCheckoutModalVisible(true)}>
                                Proceed to Checkout
                            </Button>
                        </Card.Content>
                    </Card>
                </>
            )}

            <Portal>
                <Modal
                    visible={checkoutModalVisible}
                    onDismiss={() => {
                        setCheckoutModalVisible(false)
                        setSelectedPaymentMethod(null)
                    }}
                    contentContainerStyle={styles.modalContainer}
                >
                    {selectedPaymentMethod === null ? (
                        <>
                            <Text style={styles.modalTitle}>Select Payment Method</Text>
                            <Button mode="contained" onPress={() => setSelectedPaymentMethod("card")} style={styles.methodButton}>
                                Pay with Card
                            </Button>
                            <Button mode="contained" onPress={() => setSelectedPaymentMethod("paypal")} style={styles.methodButton}>
                                Pay with PayPal
                            </Button>
                            <Button mode="outlined" onPress={() => setCheckoutModalVisible(false)} style={styles.cancelButton}>
                                Cancel
                            </Button>
                        </>
                    ) : selectedPaymentMethod === "card" ? (
                        <ScrollView>
                            <Text style={styles.modalTitle}>Payment Information</Text>
                            <Text style={styles.modalSubtitle}>Enter your card details to complete your purchase</Text>
                            <View style={styles.cardIconsContainer}>
                                <Icon name="credit-card" size={24} color="#6bb2db" style={styles.cardIcon} />
                                <Icon name="credit-card-outline" size={24} color="#6bb2db" style={styles.cardIcon} />
                                <Icon name="credit-card-multiple" size={24} color="#6bb2db" style={styles.cardIcon} />
                            </View>
                            <TextInput
                                label="Card Number"
                                value={paymentInfo.cardNumber}
                                onChangeText={formatCardNumber}
                                style={styles.input}
                                keyboardType="numeric"
                                maxLength={19}
                                error={!!errors.cardNumber}
                                left={<TextInput.Icon icon="credit-card" />}
                            />
                            {errors.cardNumber && <HelperText type="error">{errors.cardNumber}</HelperText>}
                            <TextInput
                                label="Cardholder Name"
                                value={paymentInfo.cardHolder}
                                onChangeText={(text) => setPaymentInfo({ ...paymentInfo, cardHolder: text })}
                                style={styles.input}
                                error={!!errors.cardHolder}
                                left={<TextInput.Icon icon="account" />}
                            />
                            {errors.cardHolder && <HelperText type="error">{errors.cardHolder}</HelperText>}
                            <View style={styles.row}>
                                <View style={styles.halfInput}>
                                    <TextInput
                                        label="Expiry Date (MM/YY)"
                                        value={paymentInfo.expiryDate}
                                        onChangeText={formatExpiryDate}
                                        style={styles.input}
                                        keyboardType="numeric"
                                        maxLength={5}
                                        error={!!errors.expiryDate}
                                        left={<TextInput.Icon icon="calendar" />}
                                    />
                                    {errors.expiryDate && <HelperText type="error">{errors.expiryDate}</HelperText>}
                                </View>
                                <View style={styles.halfInput}>
                                    <TextInput
                                        label="CVV"
                                        value={paymentInfo.cvv}
                                        onChangeText={(text) => setPaymentInfo({ ...paymentInfo, cvv: text.replace(/\D/g, "") })}
                                        style={styles.input}
                                        keyboardType="numeric"
                                        maxLength={3}
                                        secureTextEntry
                                        error={!!errors.cvv}
                                        left={<TextInput.Icon icon="lock" />}
                                    />
                                    {errors.cvv && <HelperText type="error">{errors.cvv}</HelperText>}
                                </View>
                            </View>
                            <View style={styles.secureNotice}>
                                <Icon name="shield-check" size={20} color="#4CAF50" />
                                <Text style={styles.secureText}>Your payment information is secure and encrypted</Text>
                            </View>
                            <View style={styles.modalButtons}>
                                <Button mode="outlined" onPress={() => setSelectedPaymentMethod(null)} style={styles.cancelButton}>
                                    Back
                                </Button>
                                <Button
                                    mode="contained"
                                    onPress={handleCheckout}
                                    style={styles.payButton}
                                    loading={processingPayment}
                                    disabled={processingPayment}
                                >
                                    Pay ${totalPrice.toFixed(2)}
                                </Button>
                            </View>
                        </ScrollView>
                    ) : selectedPaymentMethod === "paypal" ? (
                        <ScrollView
                            style={styles.paypalModalScroll}
                            contentContainerStyle={styles.paypalContentWrapper}
                            showsVerticalScrollIndicator={false}
                        >
                            <Text style={styles.paypalModalTitle}>Pago con PayPal</Text>

                            <View style={styles.paypalWebView}>
                                <PayPalCheckout
                                    amount={totalPrice}
                                    onPaymentSuccess={handlePayPalPaymentSuccess}
                                    onPaymentError={handlePayPalPaymentError}
                                    onClose={() => console.log('Pago cancelado o ventana cerrada')}
                                />
                            </View>

                            <Button
                                mode="outlined"
                                onPress={() => setSelectedPaymentMethod(null)}
                                style={styles.paypalBackButton}
                                labelStyle={styles.paypalBackButtonText}
                            >
                                Volver
                            </Button>
                        </ScrollView>
                    ) : null}
                </Modal>
            </Portal>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f5f5f5",
        paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 10,
        paddingVertical: 15,
        paddingTop: Platform.OS === "ios" ? 50 : 15,
        backgroundColor: "#2c3e50",
    },
    title: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#FFFFFF",
        textAlign: "center",
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: "#666",
    },
    emptyCartContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },
    emptyCartText: {
        fontSize: 18,
        color: "#666",
        marginTop: 10,
        marginBottom: 20,
    },
    shopButton: {
        backgroundColor: "#6bb2db",
    },
    cartItemsContainer: {
        flex: 1,
        padding: 10,
    },
    cartItemCard: {
        marginBottom: 10,
        borderRadius: 10,
        elevation: 2,
    },
    cartItemContent: {
        flexDirection: "row",
        alignItems: "center",
        padding: 10,
    },
    productImageContainer: {
        width: 80,
        height: 80,
        borderRadius: 8,
        overflow: "hidden",
        backgroundColor: "#e0e0e0",
    },
    productImage: {
        width: "100%",
        height: "100%",
        resizeMode: "cover",
    },
    productImagePlaceholder: {
        width: "100%",
        height: "100%",
        backgroundColor: "#6bb2db",
        justifyContent: "center",
        alignItems: "center",
    },
    productDetails: {
        flex: 1,
        marginLeft: 15,
    },
    productName: {
        fontSize: 16,
        fontWeight: "bold",
        marginBottom: 4,
    },
    productVendor: {
        fontSize: 12,
        color: "#666",
        marginBottom: 4,
    },
    productPrice: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#6bb2db",
        marginBottom: 8,
    },
    quantityContainer: {
        flexDirection: "row",
        alignItems: "center",
    },
    quantityButton: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: "#f0f0f0",
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#e0e0e0",
    },
    quantityText: {
        marginHorizontal: 10,
        fontSize: 14,
        fontWeight: "bold",
    },
    unitText: {
        marginLeft: 5,
        fontSize: 12,
        color: "#666",
    },
    removeButton: {
        margin: 0,
    },
    summaryCard: {
        margin: 10,
        borderRadius: 10,
        elevation: 3,
        marginBottom: Platform.OS === "ios" ? 30 : 10,
    },
    summaryRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 10,
    },
    summaryLabel: {
        fontSize: 14,
        color: "#666",
    },
    summaryValue: {
        fontSize: 14,
        fontWeight: "500",
    },
    divider: {
        marginVertical: 10,
    },
    totalLabel: {
        fontSize: 16,
        fontWeight: "bold",
    },
    totalValue: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#6bb2db",
    },
    checkoutButton: {
        marginTop: 15,
        backgroundColor: "#2c3e50",
    },
    modalContainer: {
        backgroundColor: "white",
        // flex: 1,
        justifyContent: "center",
        margin: 15,
        padding: 20,
        borderRadius: 10,
        height: '500',
        width: 'auto',
        maxwidth: "85%",
        overflow: "hidden",
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: "bold",
        marginBottom: 5,
        textAlign: "center",
    },
    modalSubtitle: {
        fontSize: 14,
        color: "#666",
        marginBottom: 20,
        textAlign: "center",
    },
    cardIconsContainer: {
        flexDirection: "row",
        justifyContent: "center",
        marginBottom: 20,
    },
    cardIcon: {
        marginHorizontal: 10,
    },
    input: {
        marginBottom: 10,
        backgroundColor: "#fff",
    },
    row: {
        flexDirection: "row",
        justifyContent: "space-between",
    },
    halfInput: {
        width: "48%",
    },
    secureNotice: {
        flexDirection: "row",
        alignItems: "center",
        marginVertical: 15,
        padding: 10,
        backgroundColor: "#f0f8ff",
        borderRadius: 5,
    },
    secureText: {
        marginLeft: 10,
        fontSize: 12,
        color: "#666",
    },
    modalButtons: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 20,
    },
    methodButton: {
        marginVertical: 10,
        backgroundColor: "#2c3e50", // Color más oscuro para mejor contraste
        paddingVertical: 12,
        borderRadius: 80,
        alignItems: "center",
    },
    methodButtonText: {
        color: "#FFFFFF",
        fontWeight: "bold",
        fontSize: 16,
    },
    cancelButton: {
        marginVertical: 10,
        borderColor: "#6bb2db",
    },
    payButton: {
        marginVertical: 10,
        backgroundColor: "#6bb2db",
    },
    /* ========== Nuevos estilos para PayPal ========== */
    paypalModalScroll: {
        flex: 1,
        paddingHorizontal: 8,
    },
    paypalContentWrapper: {
        padding: 16,
        paddingBottom: 45
    },
    paypalWebView: {
        height: 500,
        width: "100%",
        borderRadius: 8,
        overflow: "hidden",
        marginVertical: 12,
        backgroundColor: 'white',
        elevation: 3,
        borderWidth: 1,
        borderColor: "#6bb2db", // Agregado un borde para resaltar el WebView
    },

    paypalBackButton: {
        alignSelf: "center",
        marginTop: 20,
        width: "90%",
        borderColor: "#6bb2db",
        borderWidth: 1,
        paddingVertical: 10,
        borderRadius: 8,
        alignItems: "center",
    },
    paypalBackButtonText: {
        color: "#6bb2db",
        fontWeight: "600",
        fontSize: 16,
    },
    paypalModalTitle: {
        fontSize: 20,
        fontWeight: "700",
        color: "#2c3e50",
        textAlign: "center",
        marginBottom: 20,
    }
});
export default CartScreen;
