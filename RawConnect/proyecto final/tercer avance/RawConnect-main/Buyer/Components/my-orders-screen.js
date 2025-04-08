"use client"
import { useNavigation } from "@react-navigation/native"
import { useEffect, useState } from "react"
import { Alert, Platform, RefreshControl, ScrollView, StatusBar, StyleSheet, View } from "react-native"
import { Button, Card, Chip, Divider, IconButton, Text, useTheme } from "react-native-paper"
import { auth, collection, db, doc, getDocs, query, updateDoc, where } from "../../config/fb.js"

const MyOrdersScreen = () => {
    const theme = useTheme()
    const navigation = useNavigation()
    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [userRole, setUserRole] = useState(null)

    useEffect(() => {
        checkUserRole()
    }, [])

    useEffect(() => {
        if (userRole !== null) {
            fetchOrders()
        }
    }, [userRole])

    const checkUserRole = async () => {
        try {
            if (!auth.currentUser) {
                Alert.alert("Error", "You must be logged in to view your orders")
                navigation.navigate("Login")
                return
            }

            const userEmail = auth.currentUser.email
            const roleDoc = await getDocs(query(collection(db, "Roles"), where("email", "==", userEmail)))

            if (!roleDoc.empty) {
                const role = roleDoc.docs[0].data().role
                setUserRole(role)
            } else {
                setUserRole(1) // Default to buyer role
            }
        } catch (error) {
            console.error("Error checking user role:", error)
            setUserRole(1) // Fallback to buyer role
        }
    }

    const fetchOrders = async () => {
        try {
            setLoading(true)
            if (!auth.currentUser) {
                Alert.alert("Error", "You must be logged in to view your orders")
                navigation.navigate("Login")
                return
            }

            const userEmail = auth.currentUser.email
            let ordersQuery = userRole === 1
                ? query(collection(db, "orders"), where("buyerEmail", "==", userEmail))
                : query(collection(db, "orders"), where("vendorEmail", "==", userEmail))

            const querySnapshot = await getDocs(ordersQuery)
            const ordersList = []

            querySnapshot.forEach((doc) => {
                const data = doc.data()
                ordersList.push({
                    id: doc.id,
                    ...data,
                    items: data.items || [], // Ensure items is always an array
                    createdAt: data.createdAt?.toDate() || new Date(),
                    totalAmount: data.totalAmount || 0,
                    status: data.status || "pending"
                })
            })

            ordersList.sort((a, b) => b.createdAt - a.createdAt)
            setOrders(ordersList)
        } catch (error) {
            console.error("Error fetching orders:", error)
            Alert.alert("Error", "Failed to load orders")
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }

    const onRefresh = () => {
        setRefreshing(true)
        fetchOrders()
    }

    const handleUpdateOrderStatus = async (orderId, newStatus) => {
        try {
            await updateDoc(doc(db, "orders", orderId), {
                status: newStatus,
                updatedAt: new Date(),
            })

            setOrders(orders.map(order =>
                order.id === orderId ? { ...order, status: newStatus } : order
            ))

            Alert.alert("Success", `Order marked as ${newStatus}`)
        } catch (error) {
            console.error("Error updating order status:", error)
            Alert.alert("Error", "Failed to update order status")
        }
    }

    const getStatusColor = (status) => {
        const statusColors = {
            pending: "#FFC107",
            accepted: "#2196F3",
            shipped: "#6bb2db",
            delivered: "#673AB7",
            finalized: "#4CAF50",
            not_received: "#F44336",
            cancelled: "#F44336"
        }
        return statusColors[status] || "#9E9E9E"
    }

    const formatDate = (date) => {
        return date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        })
    }

    const renderOrderActions = (order) => {
        if (!order.status) return null

        const producerActions = {
            pending: (
                <View style={styles.actionButtons}>
                    <Button
                        mode="contained"
                        style={[styles.actionButton, { backgroundColor: "#4CAF50" }]}
                        onPress={() => handleUpdateOrderStatus(order.id, "accepted")}
                    >
                        Accept
                    </Button>
                    <Button
                        mode="contained"
                        style={[styles.actionButton, { backgroundColor: "#F44336" }]}
                        onPress={() => handleUpdateOrderStatus(order.id, "cancelled")}
                    >
                        Decline
                    </Button>
                </View>
            ),
            accepted: (
                <Button
                    mode="contained"
                    style={[styles.actionButton, { backgroundColor: "#6bb2db" }]}
                    onPress={() => handleUpdateOrderStatus(order.id, "shipped")}
                >
                    Mark as Shipped
                </Button>
            ),
            shipped: (
                <Button
                    mode="contained"
                    style={[styles.actionButton, { backgroundColor: "#673AB7" }]}
                    onPress={() => handleUpdateOrderStatus(order.id, "delivered")}
                >
                    Mark as Delivered
                </Button>
            )
        }

        const buyerActions = {
            delivered: (
                <View style={styles.deliveredActions}>
                    <Button
                        mode="contained"
                        style={[styles.actionButton, { backgroundColor: "#4CAF50" }]}
                        onPress={() => handleUpdateOrderStatus(order.id, "finalized")}
                    >
                        Confirm Delivery
                    </Button>
                    <Button
                        mode="outlined"
                        style={[styles.actionButton, { borderColor: "#F44336" }]}
                        textColor="#F44336"
                        onPress={() => handleUpdateOrderStatus(order.id, "not_received")}
                    >
                        Not Received
                    </Button>
                </View>
            ),
            default: (
                <Button
                    mode="outlined"
                    style={styles.cancelButton}
                    onPress={() => handleUpdateOrderStatus(order.id, "cancelled")}
                >
                    Cancel Order
                </Button>
            )
        }

        return userRole === 2
            ? producerActions[order.status]
            : order.status === "delivered"
                ? buyerActions.delivered
                : ["cancelled", "finalized", "not_received"].includes(order.status)
                    ? null
                    : buyerActions.default
    }

    const renderEmptyOrders = () => (
        <View style={styles.emptyContainer}>
            <IconButton icon="package-variant" size={60} iconColor="#6bb2db" />
            <Text style={styles.emptyText}>
                {userRole === 1 ? "You haven't placed any orders yet" : "You haven't received any orders yet"}
            </Text>
            {userRole === 1 && (
                <Button mode="contained" style={styles.shopButton} onPress={() => navigation.navigate("Home")}>
                    Start Shopping
                </Button>
            )}
        </View>
    )

    const renderOrderItem = (item, index) => (
        <View key={`${item.productId || index}`} style={styles.itemRow}>
            <Text style={styles.itemName}>
                {item.quantity || 1} x {item.productName || "Unknown Product"}
            </Text>
            <Text style={styles.itemPrice}>
                ${((item.price || 0) * (item.quantity || 1)).toFixed(2)}
            </Text>
        </View>
    )

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <IconButton icon="arrow-left" iconColor="#FFFFFF" size={24} onPress={() => navigation.goBack()} />
                <Text style={styles.title}>{userRole === 1 ? "My Orders" : "Manage Orders"}</Text>
                <IconButton icon="refresh" iconColor="#FFFFFF" size={24} onPress={onRefresh} />
            </View>

            <ScrollView
                contentContainerStyle={styles.ordersContainer}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#6bb2db"]} />}
            >
                {loading ? (
                    <View style={styles.loadingContainer}>
                        <Text>Loading orders...</Text>
                    </View>
                ) : orders.length === 0 ? (
                    renderEmptyOrders()
                ) : (
                    orders.map((order) => (
                        <Card key={order.id} style={styles.orderCard}>
                            <Card.Content>
                                <View style={styles.orderHeader}>
                                    <View>
                                        <Text style={styles.orderTitle}>Order #{order.id.substring(0, 6)}</Text>
                                        <Text style={styles.orderDate}>{formatDate(order.createdAt)}</Text>
                                    </View>
                                    <Chip
                                        style={[styles.statusChip, { backgroundColor: getStatusColor(order.status) }]}
                                        textStyle={styles.statusText}
                                    >
                                        {order.status?.charAt(0).toUpperCase() + order.status?.slice(1).replace('_', ' ') || "Unknown"}
                                    </Chip>
                                </View>

                                <Divider style={styles.divider} />

                                <View style={styles.orderDetails}>
                                    <Text style={styles.vendorText}>
                                        {userRole === 1 ? `Seller: ${order.vendorEmail || "Unknown"}` : `Buyer: ${order.buyerEmail || "Unknown"}`}
                                    </Text>

                                    <Text style={styles.itemsTitle}>Items:</Text>
                                    {(order.items || []).map(renderOrderItem)}

                                    <View style={styles.totalRow}>
                                        <Text style={styles.totalLabel}>Total</Text>
                                        <Text style={styles.totalValue}>${order.totalAmount?.toFixed(2) || "0.00"}</Text>
                                    </View>
                                </View>

                                {renderOrderActions(order)}
                            </Card.Content>
                        </Card>
                    ))
                )}
            </ScrollView>
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
        paddingTop: Platform.OS === "android" ? 15 : 50,
        backgroundColor: "#2c3e50",
    },
    title: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#FFFFFF",
        textAlign: "center",
        flex: 1,
    },
    ordersContainer: {
        padding: 15,
        paddingBottom: 30,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },
    emptyContainer: {
        alignItems: "center",
        justifyContent: "center",
        padding: 30,
    },
    emptyText: {
        fontSize: 16,
        color: "#666",
        textAlign: "center",
        marginVertical: 15,
    },
    shopButton: {
        marginTop: 15,
        backgroundColor: "#6bb2db",
    },
    orderCard: {
        marginBottom: 15,
        borderRadius: 10,
        elevation: 2,
    },
    orderHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
    },
    orderTitle: {
        fontSize: 16,
        fontWeight: "bold",
    },
    orderDate: {
        fontSize: 14,
        color: "#666",
        marginTop: 4,
    },
    statusChip: {
        height: 28,
    },
    statusText: {
        color: "white",
        fontSize: 12,
        fontWeight: "bold",
    },
    divider: {
        marginVertical: 12,
    },
    orderDetails: {
        marginBottom: 15,
    },
    vendorText: {
        fontSize: 14,
        color: "#666",
        marginBottom: 10,
    },
    itemsTitle: {
        fontSize: 14,
        fontWeight: "bold",
        marginBottom: 8,
    },
    itemRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 6,
    },
    itemName: {
        fontSize: 14,
        flex: 1,
    },
    itemPrice: {
        fontSize: 14,
        fontWeight: "500",
    },
    totalRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 10,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: "#eee",
    },
    totalLabel: {
        fontSize: 16,
        fontWeight: "bold",
    },
    totalValue: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#6bb2db",
    },
    actionButtons: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 10,
    },
    deliveredActions: {
        flexDirection: "column",
        gap: 10,
        marginTop: 10,
    },
    actionButton: {
        flex: 1,
        marginHorizontal: 0,
    },
    cancelButton: {
        marginTop: 10,
        borderColor: "#F44336",
        borderWidth: 1,
    },
})

export default MyOrdersScreen