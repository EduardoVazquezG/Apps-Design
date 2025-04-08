"use client"
import { useNavigation, useRoute } from "@react-navigation/native"
import { doc, getDoc, getFirestore, updateDoc } from "firebase/firestore"
import React, { useEffect, useState } from 'react'
import { Alert, ScrollView, StyleSheet, TextInput, View } from "react-native"
import { Button, Card, Dialog, Divider, Menu, Portal, Text, useTheme } from "react-native-paper"

const OrderDetails = () => {
    const theme = useTheme()
    const navigation = useNavigation()
    const route = useRoute()
    const { orderId } = route.params

    const [order, setOrder] = useState(null)
    const [customerData, setCustomerData] = useState({
        name: '',
        email: '',
        address: ''
    })
    const [loading, setLoading] = useState(true)
    const [loadingCustomer, setLoadingCustomer] = useState(true)
    const [statusMenuVisible, setStatusMenuVisible] = useState(false)
    const [updatingStatus, setUpdatingStatus] = useState(false)
    const [rejectionDialogVisible, setRejectionDialogVisible] = useState(false)
    const [rejectionReason, setRejectionReason] = useState('')

    const getAvailableStatusOptions = (currentStatus) => {
        switch (currentStatus) {
            case 'pending':
                return [
                    { label: 'Accept', value: 'accepted' },
                    { label: 'Reject', value: 'rejected' }
                ];
            case 'accepted':
                return [
                    { label: 'Mark as Shipped', value: 'shipped' }
                ];
            case 'shipped':
                return [
                    { label: 'Mark as Delivered', value: 'delivered' }
                ];
            default:
                return [];
        }
    }

    const [availableStatusOptions, setAvailableStatusOptions] = useState([])

    useEffect(() => {
        fetchOrderDetails()
    }, [])

    useEffect(() => {
        if (order?.status) {
            setAvailableStatusOptions(getAvailableStatusOptions(order.status))
        }
    }, [order?.status])

    const fetchCustomerData = async (email) => {
        setLoadingCustomer(true)
        const db = getFirestore()
        try {
            const userRef = doc(db, "users", email)
            const userSnap = await getDoc(userRef)

            if (userSnap.exists()) {
                const userData = userSnap.data()
                setCustomerData({
                    name: userData.fullName || userData.displayName || email,
                    email: email,
                    address: userData.address || 'No address provided'
                })
                return
            }

            setCustomerData({
                name: email,
                email: email,
                address: 'No address available'
            })
        } catch (error) {
            console.error("Error fetching customer data:", error)
            setCustomerData({
                name: email,
                email: email,
                address: 'Error loading address'
            })
        } finally {
            setLoadingCustomer(false)
        }
    }

    const fetchOrderDetails = async () => {
        setLoading(true)
        const db = getFirestore()
        const orderRef = doc(db, "orders", orderId)

        try {
            const docSnap = await getDoc(orderRef)
            if (docSnap.exists()) {
                const orderData = docSnap.data()
                setOrder(orderData)
                await fetchCustomerData(orderData.buyerEmail)
            } else {
                console.log("No such order!")
            }
        } catch (error) {
            console.error("Error getting order details:", error)
        } finally {
            setLoading(false)
        }
    }

    const handleStatusSelection = (status) => {
        if (status === 'rejected') {
            setRejectionDialogVisible(true)
        } else {
            updateOrderStatus(status)
        }
    }

    const confirmRejection = () => {
        if (rejectionReason.trim() === '') {
            Alert.alert('Error', 'Please provide a reason for rejection')
            return
        }
        updateOrderStatus('rejected', rejectionReason)
        setRejectionDialogVisible(false)
        setRejectionReason('')
    }

    const updateOrderStatus = async (newStatus, rejectionReason = null) => {
        setUpdatingStatus(true)
        const db = getFirestore()
        const orderRef = doc(db, "orders", orderId)

        try {
            const updateData = {
                status: newStatus,
                updatedAt: new Date()
            }

            if (newStatus === 'rejected' && rejectionReason) {
                updateData.rejectionReason = rejectionReason
            }

            await updateDoc(orderRef, updateData)
            setOrder(prev => ({ ...prev, ...updateData }))

            Alert.alert('Success', `Order status updated to ${newStatus}`)

        } catch (error) {
            console.error("Error updating order status:", error)
            Alert.alert('Error', "Failed to update status")
        } finally {
            setUpdatingStatus(false)
            setStatusMenuVisible(false)
        }
    }

    const formatDate = (timestamp) => {
        const date = timestamp.toDate()
        return date.toLocaleString()
    }

    const getStatusColor = (status) => {
        switch (status) {
            case 'accepted': return '#4CAF50'
            case 'rejected': return '#F44336'
            case 'shipped': return '#2196F3'
            case 'delivered': return '#673AB7'
            case "finalized": return "#4CAF50"
            case 'pending': return '#FFC107'
            default: return '#9E9E9E'
        }
    }

    if (loading) {
        return (
            <View style={styles.container}>
                <Text style={styles.loadingText}>Loading order details...</Text>
            </View>
        )
    }

    if (!order) {
        return (
            <View style={styles.container}>
                <Text style={styles.errorText}>Order not found</Text>
            </View>
        )
    }

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.contentContainer}>
                <Card style={styles.detailsCard}>
                    <Card.Content>
                        <Text style={styles.orderId}>Order #{orderId.substring(0, 8)}...</Text>

                        <View style={styles.statusContainer}>
                            <Text style={[styles.status, { color: getStatusColor(order.status) }]}>
                                Status: {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                {order.rejectionReason && order.status === 'rejected' && (
                                    <Text style={styles.rejectionReasonText}>
                                        {'\n'}Reason: {order.rejectionReason}
                                    </Text>
                                )}
                            </Text>

                            {availableStatusOptions.length > 0 && (
                                <Menu
                                    visible={statusMenuVisible}
                                    onDismiss={() => setStatusMenuVisible(false)}
                                    anchor={
                                        <Button
                                            mode="contained"
                                            onPress={() => setStatusMenuVisible(true)}
                                            loading={updatingStatus}
                                            style={styles.statusButton}
                                        >
                                            Update Status
                                        </Button>
                                    }
                                >
                                    {availableStatusOptions.map((option) => (
                                        <Menu.Item
                                            key={option.value}
                                            onPress={() => handleStatusSelection(option.value)}
                                            title={option.label}
                                            style={styles.menuItem}
                                        />
                                    ))}
                                </Menu>
                            )}
                        </View>

                        <Portal>
                            <Dialog
                                visible={rejectionDialogVisible}
                                onDismiss={() => setRejectionDialogVisible(false)}
                            >
                                <Dialog.Title>Rejection Reason</Dialog.Title>
                                <Dialog.Content>
                                    <Text>Please provide a reason for rejecting this order:</Text>
                                    <TextInput
                                        style={styles.reasonInput}
                                        multiline
                                        numberOfLines={4}
                                        value={rejectionReason}
                                        onChangeText={setRejectionReason}
                                        placeholder="Enter rejection reason..."
                                    />
                                </Dialog.Content>
                                <Dialog.Actions>
                                    <Button onPress={() => setRejectionDialogVisible(false)}>
                                        Cancel
                                    </Button>
                                    <Button
                                        onPress={confirmRejection}
                                        mode="contained"
                                        disabled={!rejectionReason.trim()}
                                    >
                                        Confirm Rejection
                                    </Button>
                                </Dialog.Actions>
                            </Dialog>
                        </Portal>

                        <Divider style={styles.divider} />

                        <Text style={styles.sectionTitle}>Customer Information</Text>
                        {loadingCustomer ? (
                            <Text>Loading customer info...</Text>
                        ) : (
                            <>
                                <Text>Name: {customerData.name}</Text>
                                <Text>Email: {customerData.email}</Text>
                                <Text>Address: {customerData.address}</Text>
                            </>
                        )}

                        <Divider style={styles.divider} />

                        <Text style={styles.sectionTitle}>Order Date</Text>
                        <Text>{formatDate(order.createdAt)}</Text>

                        <Divider style={styles.divider} />

                        <Text style={styles.sectionTitle}>Items</Text>
                        {order.items.map((item, index) => (
                            <View key={index} style={styles.itemContainer}>
                                <Text style={styles.itemName}>{item.productName}</Text>
                                <Text>Quantity: {item.quantity} {item.unitMeasure}</Text>
                                <Text>Price: ${item.price.toLocaleString()} per {item.unitMeasure}</Text>
                                <Text>Subtotal: ${(item.price * item.quantity).toLocaleString()}</Text>
                            </View>
                        ))}

                        <Divider style={styles.divider} />

                        <Text style={styles.sectionTitle}>Payment Information</Text>
                        <Text>Method: {order.paymentDetails.paymentMethod}</Text>
                        <Text>Card Holder: {order.paymentDetails.cardHolder}</Text>
                        <Text>Card Ending: ****{order.paymentDetails.cardLast4}</Text>

                        <Divider style={styles.divider} />

                        <View style={styles.totalContainer}>
                            <Text style={styles.totalText}>Total Amount:</Text>
                            <Text style={styles.totalAmount}>${order.totalAmount.toLocaleString()}</Text>
                        </View>
                    </Card.Content>
                </Card>
            </ScrollView>
        </View>
    )
}

// ... (los estilos se mantienen igual)
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#263238",
        padding: 20,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: "bold",
        color: "#FFFFFF",
        marginLeft: 10,
    },
    contentContainer: {
        paddingBottom: 20,
    },
    detailsCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 8,
    },
    orderId: {
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 5,
    },
    statusContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    status: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    rejectionReasonText: {
        fontSize: 14,
        color: '#F44336',
        fontStyle: 'italic',
    },
    statusButton: {
        marginLeft: 10,
        backgroundColor: '#6200EE',
    },
    reasonInput: {
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 4,
        padding: 10,
        marginTop: 10,
        minHeight: 100,
        backgroundColor: '#FAFAFA',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: "bold",
        marginTop: 10,
        marginBottom: 5,
    },
    divider: {
        marginVertical: 10,
        backgroundColor: "#E0E0E0",
    },
    itemContainer: {
        marginBottom: 10,
        padding: 10,
        backgroundColor: "#FAFAFA",
        borderRadius: 5,
    },
    itemName: {
        fontWeight: "bold",
        marginBottom: 5,
    },
    totalContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 15,
    },
    totalText: {
        fontWeight: "bold",
        fontSize: 16,
    },
    totalAmount: {
        fontWeight: "bold",
        fontSize: 18,
        color: "#388E3C",
    },
    loadingText: {
        color: "#FFFFFF",
        textAlign: "center",
        marginTop: 20,
    },
    errorText: {
        color: "#F44336",
        textAlign: "center",
        marginTop: 20,
    },
    menuItem: {
        paddingVertical: 8,
        paddingHorizontal: 16,
    },
})

export default OrderDetails