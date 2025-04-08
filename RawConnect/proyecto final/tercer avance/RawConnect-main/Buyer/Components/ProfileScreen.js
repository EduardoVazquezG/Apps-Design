"use client"

import { useEffect, useState } from "react"
import { Alert, Platform, ScrollView, StatusBar, StyleSheet, TouchableOpacity, View } from "react-native"
import { Avatar, Button, Card, Divider, HelperText, Modal, Portal, Text, TextInput, useTheme } from "react-native-paper"
import Icon from "react-native-vector-icons/MaterialCommunityIcons"
import { auth, db, deleteDoc, doc, getDoc, setDoc, signOut, updateDoc } from "../../config/fb.js"

const BuyerProfileScreen = ({ route, navigation }) => {
    const theme = useTheme()
    const [isEditing, setIsEditing] = useState(false)
    const [loading, setLoading] = useState(true)
    const [userData, setUserData] = useState({
        fullName: "",
        email: "",
        address: "",
        createdAt: null,
        profileImage: null,
    })
    const [savedCard, setSavedCard] = useState(null)
    const [cardModalVisible, setCardModalVisible] = useState(false)
    const [cardVerificationVisible, setCardVerificationVisible] = useState(false)
    const [newCardInfo, setNewCardInfo] = useState({
        cardNumber: "",
        cardHolder: "",
        expiryDate: "",
        cvv: "",
    })
    const [verificationCvv, setVerificationCvv] = useState("")
    const [errors, setErrors] = useState({})

    useEffect(() => {
        if (route.params?.userData) {
            setUserData(route.params.userData)
            setLoading(false)
        } else {
            const fetchUserData = async () => {
                try {
                    if (auth && auth.currentUser) {
                        const currentUser = auth.currentUser
                        const userDocRef = doc(db, "users", currentUser.email)
                        const userDoc = await getDoc(userDocRef)

                        if (userDoc.exists()) {
                            setUserData({
                                email: currentUser.email,
                                ...userDoc.data(),
                            })
                        } else {
                            const defaultUserData = {
                                email: currentUser.email,
                                fullName: currentUser.displayName || "",
                                address: "",
                                createdAt: new Date(),
                                profileImage: null,
                            }

                            setUserData(defaultUserData)

                            try {
                                await setDoc(userDocRef, defaultUserData)
                            } catch (error) {
                                console.error("Error creating user document:", error)
                            }
                        }

                        await fetchSavedCardInfo()
                    } else {
                        Alert.alert("Not Logged In", "You need to be logged in to view your profile.", [
                            { text: "OK", onPress: () => navigation.navigate("Login") },
                        ])
                    }
                } catch (error) {
                    console.error("Error fetching user data:", error)
                } finally {
                    setLoading(false)
                }
            }
            fetchUserData()
        }

        const unsubscribeFocus = navigation.addListener("focus", () => {
            fetchSavedCardInfo()
        })

        return unsubscribeFocus
    }, [route.params?.userData, navigation])

    const fetchSavedCardInfo = async () => {
        try {
            if (!auth.currentUser) return

            const userEmail = auth.currentUser.email
            const cardDocRef = doc(db, "userPaymentMethods", userEmail)
            const cardDoc = await getDoc(cardDocRef)

            if (cardDoc.exists()) {
                setSavedCard(cardDoc.data())
            } else {
                setSavedCard(null)
            }
        } catch (error) {
            console.error("Error fetching saved card:", error)
        }
    }

    const handleEdit = () => {
        if (isEditing) {
            handleSave()
        }
        setIsEditing(!isEditing)
    }

    const handleSave = async () => {
        try {
            if (auth && auth.currentUser) {
                const currentUser = auth.currentUser
                const userDocRef = doc(db, "users", currentUser.email)

                const { email, createdAt, ...dataToUpdate } = userData

                await updateDoc(userDocRef, dataToUpdate)
                Alert.alert("Success", "Profile updated successfully")
            } else {
                Alert.alert("Error", "You must be logged in to update your profile")
            }
        } catch (error) {
            console.error("Error updating profile:", error)
            Alert.alert("Error", "Failed to update profile. Please try again.")
        } finally {
            setIsEditing(false)
        }
    }

    const handleResetPassword = () => {
        Alert.alert("Reset Password", "Are you sure you want to reset your password?", [
            {
                text: "Cancel",
                style: "cancel",
            },
            {
                text: "Yes",
                onPress: () => {
                    if (auth && auth.currentUser) {
                        auth
                            .sendPasswordResetEmail(auth.currentUser.email)
                            .then(() => {
                                Alert.alert("Password Reset", "Password reset email has been sent to your email address.")
                            })
                            .catch((error) => {
                                Alert.alert("Error", "Failed to send password reset email. Please try again.")
                                console.error("Error sending password reset email:", error)
                            })
                    } else {
                        Alert.alert("Error", "You must be logged in to reset your password")
                    }
                },
            },
        ])
    }

    const handleSignOut = () => {
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

    const handleAddCard = () => {
        setCardModalVisible(true)
    }

    const handleChangeCard = () => {
        setVerificationCvv("")
        setCardVerificationVisible(true)
    }

    const handleRemoveCard = () => {
        Alert.alert("Remove Card", "Are you sure you want to remove your saved card?", [
            {
                text: "Cancel",
                style: "cancel",
            },
            {
                text: "Remove",
                onPress: async () => {
                    try {
                        if (!auth.currentUser) return

                        const userEmail = auth.currentUser.email
                        const cardDocRef = doc(db, "userPaymentMethods", userEmail)

                        await deleteDoc(cardDocRef)

                        setSavedCard(null)
                        Alert.alert("Success", "Your card has been removed")
                    } catch (error) {
                        console.error("Error removing card:", error)
                        Alert.alert("Error", "Failed to remove card. Please try again.")
                    }
                },
            },
        ])
    }

    const validateCardInfo = () => {
        const newErrors = {}

        if (!newCardInfo.cardNumber.trim() || newCardInfo.cardNumber.length < 16) {
            newErrors.cardNumber = "Please enter a valid 16-digit card number"
        }

        if (!newCardInfo.cardHolder.trim()) {
            newErrors.cardHolder = "Please enter the cardholder name"
        }

        if (!newCardInfo.expiryDate.trim() || !newCardInfo.expiryDate.includes("/")) {
            newErrors.expiryDate = "Please enter a valid expiry date (MM/YY)"
        } else {
            const [month, year] = newCardInfo.expiryDate.split("/")
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

        if (!newCardInfo.cvv.trim() || newCardInfo.cvv.length < 3) {
            newErrors.cvv = "Please enter a valid CVV"
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSaveNewCard = async () => {
        if (!validateCardInfo()) return

        try {
            if (!auth.currentUser) return

            const userEmail = auth.currentUser.email
            const cardDocRef = doc(db, "userPaymentMethods", userEmail)

            await setDoc(cardDocRef, {
                cardNumber: newCardInfo.cardNumber,
                cardHolder: newCardInfo.cardHolder,
                expiryDate: newCardInfo.expiryDate,
                lastFour: newCardInfo.cardNumber.slice(-4),
                updatedAt: new Date(),
            })

            setSavedCard({
                cardNumber: newCardInfo.cardNumber,
                cardHolder: newCardInfo.cardHolder,
                expiryDate: newCardInfo.expiryDate,
                lastFour: newCardInfo.cardNumber.slice(-4),
            })

            setNewCardInfo({
                cardNumber: "",
                cardHolder: "",
                expiryDate: "",
                cvv: "",
            })
            setCardModalVisible(false)

            Alert.alert("Success", "Your card has been saved")
        } catch (error) {
            console.error("Error saving card:", error)
            Alert.alert("Error", "Failed to save card. Please try again.")
        }
    }

    const handleVerifyCvv = () => {
        if (!verificationCvv.trim() || verificationCvv.length < 3) {
            Alert.alert("Error", "Please enter a valid CVV")
            return
        }


        setCardVerificationVisible(false)
        setCardModalVisible(true)
    }

    const formatCardNumber = (text) => {
        const cleaned = text.replace(/\D/g, "")
        const trimmed = cleaned.substring(0, 16)
        const formatted = trimmed.replace(/(\d{4})(?=\d)/g, "$1 ")

        setNewCardInfo({ ...newCardInfo, cardNumber: formatted })
    }

    const formatExpiryDate = (text) => {
        const cleaned = text.replace(/\D/g, "")
        const trimmed = cleaned.substring(0, 4)

        if (trimmed.length > 2) {
            const formatted = `${trimmed.substring(0, 2)}/${trimmed.substring(2)}`
            setNewCardInfo({ ...newCardInfo, expiryDate: formatted })
        } else {
            setNewCardInfo({ ...newCardInfo, expiryDate: trimmed })
        }
    }

    const formatDate = (timestamp) => {
        if (!timestamp) return "N/A"

        try {
            const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
            return date.toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
            })
        } catch (error) {
            console.error("Error formatting date:", error)
            return "N/A"
        }
    }

    const renderField = (icon, label, value, key, editable = true) => (
        <View style={styles.fieldContainer}>
            <Icon name={icon} size={24} color="#2C3E50" style={styles.fieldIcon} />
            <View style={styles.fieldContent}>
                <Text style={styles.fieldLabel}>{label}</Text>
                {isEditing && editable ? (
                    <TextInput
                        mode="flat"
                        value={value}
                        onChangeText={(text) => setUserData({ ...userData, [key]: text })}
                        style={styles.input}
                    />
                ) : (
                    <Text style={styles.fieldValue}>{value || "Not set"}</Text>
                )}
            </View>
        </View>
    )

    if (loading) {
        return (
            <View style={[styles.container, styles.loadingContainer]}>
                <Text>Loading profile...</Text>
            </View>
        )
    }

    return (
        <View style={styles.container}>
            <View style={styles.topBar}>
                <TouchableOpacity
                    onPress={() => navigation.openDrawer()}
                    style={styles.menuButton}
                    accessibilityLabel="Open menu"
                >
                    <Icon name="menu" size={24} color="#FFFFFF" />
                </TouchableOpacity>
                <Text style={styles.topBarTitle}>My Profile</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.scrollContainer}>
                <View style={styles.header}>
                    {userData?.profileImage ? (
                        <Avatar.Image size={120} source={{ uri: userData.profileImage }} />
                    ) : (
                        <Avatar.Text
                            size={120}
                            label={userData?.fullName?.charAt(0) || userData?.email?.charAt(0) || "B"}
                            backgroundColor="#2C3E50"
                        />
                    )}
                    <TouchableOpacity style={styles.editButton} onPress={handleEdit}>
                        <Icon name={isEditing ? "check" : "pencil"} size={24} color="#2C3E50" />
                    </TouchableOpacity>
                </View>
                <View style={styles.content}>
                    {renderField("account", "Full Name", userData.fullName, "fullName")}
                    {renderField("email", "Email", userData.email, "email", false)}
                    {renderField("map-marker", "Address", userData.address, "address")}
                    {renderField("calendar", "Member Since", formatDate(userData.createdAt), "createdAt", false)}

                    <Divider style={styles.divider} />

                    <Text style={styles.sectionTitle}>Payment Methods</Text>

                    {savedCard ? (
                        <Card style={styles.cardContainer}>
                            <Card.Content>
                                <View style={styles.cardHeader}>
                                    <Icon name="credit-card" size={24} color="#2C3E50" />
                                    <Text style={styles.cardTitle}>Saved Card</Text>
                                </View>
                                <View style={styles.cardDetails}>
                                    <Text style={styles.cardNumber}>•••• •••• •••• {savedCard.lastFour}</Text>
                                    <Text style={styles.cardName}>{savedCard.cardHolder}</Text>
                                    <Text style={styles.cardExpiry}>Expires: {savedCard.expiryDate}</Text>
                                </View>
                                <View style={styles.cardActions}>
                                    <Button mode="outlined" onPress={handleRemoveCard} style={[styles.cardButton, styles.removeButton]}>
                                        <View style={styles.buttonContent}>
                                            <Icon name="delete" size={16} color="#D32F2F" style={styles.buttonIcon} />
                                            <Text>Remove</Text>
                                        </View>
                                    </Button>
                                </View>
                            </Card.Content>
                        </Card>
                    ) : (
                        <View style={styles.noCardContainer}>
                            <Icon name="credit-card-off" size={40} color="#999" />
                            <Text style={styles.noCardText}>No payment method saved</Text>
                            <Text style={styles.noCardSubtext}>
                                Your payment method will be saved automatically when you make a purchase
                            </Text>
                        </View>
                    )}

                    <Divider style={styles.divider} />

                    <Button mode="contained" onPress={handleResetPassword} style={styles.resetButton}>
                        Reset Password
                    </Button>

                    <Button mode="outlined" onPress={() => navigation.goBack()} style={styles.backButton}>
                        Back to Dashboard
                    </Button>

                    <Button mode="contained" onPress={handleSignOut} style={styles.signOutButton}>
                        <View style={styles.buttonContent}>
                            <Icon name="logout" size={18} color="#FFFFFF" style={styles.buttonIcon} />
                            <Text style={styles.buttonText}>Sign Out</Text>
                        </View>
                    </Button>
                </View>
            </ScrollView>

            <Portal>
                <Modal
                    visible={cardVerificationVisible}
                    onDismiss={() => setCardVerificationVisible(false)}
                    contentContainerStyle={styles.modalContainer}
                >
                    <Text style={styles.modalTitle}>Verify Your Card</Text>
                    <Text style={styles.modalSubtitle}>Please enter your card's security code (CVV) to continue</Text>

                    <View style={styles.cvvContainer}>
                        <TextInput
                            label="CVV"
                            value={verificationCvv}
                            onChangeText={setVerificationCvv}
                            style={styles.cvvInput}
                            keyboardType="numeric"
                            maxLength={4}
                            secureTextEntry
                            left={<TextInput.Icon icon="lock" />}
                        />
                    </View>

                    <View style={styles.modalButtons}>
                        <Button mode="outlined" onPress={() => setCardVerificationVisible(false)} style={styles.cancelButton}>
                            Cancel
                        </Button>
                        <Button mode="contained" onPress={handleVerifyCvv} style={styles.verifyButton}>
                            Verify
                        </Button>
                    </View>
                </Modal>
            </Portal>

            <Portal>
                <Modal
                    visible={cardModalVisible}
                    onDismiss={() => setCardModalVisible(false)}
                    contentContainerStyle={styles.modalContainer}
                >
                    <Text style={styles.modalTitle}>{savedCard ? "Update Payment Method" : "Add Payment Method"}</Text>
                    <Text style={styles.modalSubtitle}>Enter your card details</Text>

                    <TextInput
                        label="Card Number"
                        value={newCardInfo.cardNumber}
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
                        value={newCardInfo.cardHolder}
                        onChangeText={(text) => setNewCardInfo({ ...newCardInfo, cardHolder: text })}
                        style={styles.input}
                        error={!!errors.cardHolder}
                        left={<TextInput.Icon icon="account" />}
                    />
                    {errors.cardHolder && <HelperText type="error">{errors.cardHolder}</HelperText>}

                    <View style={styles.row}>
                        <View style={styles.halfInput}>
                            <TextInput
                                label="Expiry Date (MM/YY)"
                                value={newCardInfo.expiryDate}
                                onChangeText={formatExpiryDate}
                                style={styles.input}
                                keyboardType="numeric"
                                maxLength={5} // MM/YY
                                error={!!errors.expiryDate}
                                left={<TextInput.Icon icon="calendar" />}
                            />
                            {errors.expiryDate && <HelperText type="error">{errors.expiryDate}</HelperText>}
                        </View>

                        <View style={styles.halfInput}>
                            <TextInput
                                label="CVV"
                                value={newCardInfo.cvv}
                                onChangeText={(text) => setNewCardInfo({ ...newCardInfo, cvv: text.replace(/\D/g, "") })}
                                style={styles.input}
                                keyboardType="numeric"
                                maxLength={4}
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
                        <Button mode="outlined" onPress={() => setCardModalVisible(false)} style={styles.cancelButton}>
                            Cancel
                        </Button>
                        <Button mode="contained" onPress={handleSaveNewCard} style={styles.saveButton}>
                            Save Card
                        </Button>
                    </View>
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
    scrollContainer: {
        flexGrow: 1,
    },
    topBar: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 15,
        paddingTop: Platform.OS === "ios" ? 60 : 25,
        backgroundColor: "#2c3e50",
        height: Platform.OS === "ios" ? 100 : 70,
    },
    menuButton: {
        padding: 8,
        borderRadius: 4,
        backgroundColor: "rgba(255, 255, 255, 0.2)",
    },
    topBarTitle: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#FFFFFF",
        textAlign: "center",
        flex: 1,
        marginTop: Platform.OS === "ios" ? 0 : 5,
    },
    scrollContainer: {
        flex: 1,
    },
    loadingContainer: {
        justifyContent: "center",
        alignItems: "center",
    },
    header: {
        alignItems: "center",
        paddingVertical: 30,
        backgroundColor: "#ffffff",
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    editButton: {
        position: "absolute",
        right: 20,
        top: 20,
        backgroundColor: "#ffffff",
        borderRadius: 20,
        padding: 10,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    content: {
        padding: 20,
    },
    fieldContainer: {
        flexDirection: "row",
        alignItems: "flex-start",
        marginBottom: 20,
        backgroundColor: "#ffffff",
        borderRadius: 10,
        padding: 15,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.22,
        shadowRadius: 2.22,
        elevation: 3,
    },
    fieldIcon: {
        marginRight: 15,
        marginTop: 2,
    },
    fieldContent: {
        flex: 1,
    },
    fieldLabel: {
        fontSize: 14,
        color: "#666",
        marginBottom: 5,
    },
    fieldValue: {
        fontSize: 16,
        color: "#333",
    },
    input: {
        backgroundColor: "transparent",
        paddingHorizontal: 0,
        paddingVertical: 0,
    },
    divider: {
        marginVertical: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 15,
        color: "#2c3e50",
    },
    cardContainer: {
        marginBottom: 20,
        borderRadius: 10,
        borderLeftWidth: 4,
        borderLeftColor: "#2C3E50",
        elevation: 3,
        backgroundColor: "#ffffff",

    },
    cardHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 15,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: "bold",
        marginLeft: 10,
        color: "#2c3e50",
    },
    cardDetails: {
        marginBottom: 15,
    },
    cardNumber: {
        fontSize: 16,
        marginBottom: 5,
    },
    cardName: {
        fontSize: 14,
        color: "#666",
        marginBottom: 5,
    },
    cardExpiry: {
        fontSize: 14,
        color: "#666",
    },
    cardActions: {
        flexDirection: "row",
        justifyContent: "space-between",
    },
    cardButton: {
        flex: 1,
        marginHorizontal: 5,
        borderColor: "#2C3E50",
    },
    removeButton: {
        borderColor: "#D32F2F",
    },
    addCardButton: {
        backgroundColor: "#2C3E50",
        marginBottom: 20,
    },
    resetButton: {
        marginTop: 10,
        backgroundColor: "#2C3E50",
    },
    backButton: {
        marginTop: 15,
        borderColor: "#2C3E50",
    },
    signOutButton: {
        marginTop: 20,
        backgroundColor: "#D32F2F",
    },
    modalContainer: {
        backgroundColor: "white",
        padding: 20,
        margin: 20,
        borderRadius: 10,
        maxHeight: "80%",
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
    cvvContainer: {
        marginVertical: 20,
    },
    cvvInput: {
        backgroundColor: "#fff",
    },
    modalButtons: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 20,
    },
    cancelButton: {
        flex: 1,
        marginRight: 10,
        borderColor: "#2C3E50",
    },
    verifyButton: {
        flex: 2,
        backgroundColor: "#2C3E50",
    },
    saveButton: {
        flex: 2,
        backgroundColor: "#2C3E50",
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
    buttonContent: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
    },
    buttonIcon: {
        marginRight: 8,
    },
    buttonText: {
        color: "#FFFFFF",
        fontWeight: "bold",
    },
    noCardContainer: {
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        backgroundColor: "#f9f9f9",
        borderRadius: 10,
        marginBottom: 20,
    },
    noCardText: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#666",
        marginTop: 10,
    },
    noCardSubtext: {
        fontSize: 14,
        color: "#888",
        textAlign: "center",
        marginTop: 5,
    },
})

export default BuyerProfileScreen

