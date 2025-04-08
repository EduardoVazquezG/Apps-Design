"use client"
import { useNavigation } from "@react-navigation/native"
import { getAuth } from "firebase/auth"
import { collection, doc, getDoc, getFirestore, query, where, getDocs } from "firebase/firestore"
import { useEffect, useState } from "react"
import { Alert, ScrollView, StyleSheet, View } from "react-native"
import { Button, Card, IconButton, Menu, Text, useTheme } from "react-native-paper"

const MyOrdersScreen = () => {
    const theme = useTheme()
    const navigation = useNavigation()

    const [orders, setOrders] = useState([])
    const [filteredOrders, setFilteredOrders] = useState([])
    const [customerNames, setCustomerNames] = useState({})
    const [loading, setLoading] = useState(true)
    const [statusFilter, setStatusFilter] = useState("all")
    const [menuVisible, setMenuVisible] = useState(false)
    const [debugInfo, setDebugInfo] = useState("")
    const [allVendorEmails, setAllVendorEmails] = useState([])

    const statusOptions = [
        { label: "All", value: "all" },
        { label: "Pending", value: "pending" },
        { label: "Accepted", value: "accepted" },
        { label: "Shipped", value: "shipped" },
        { label: "Delivered", value: "delivered" },
        { label: "Finalized", value: "finalized" },
        { label: "Rejected", value: "rejected" },
    ]

    const auth = getAuth()
    const [currentUser, setCurrentUser] = useState(null)

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            if (user) {
                console.log("Usuario autenticado:", user.email)
                setCurrentUser(user)
                setDebugInfo(`Usuario: ${user.email}\nUID: ${user.uid}`)
                fetchOrders(user.email)
            } else {
                console.log("No autenticado - redirigiendo a login")
                navigation.navigate("Login")
            }
        })

        return unsubscribe
    }, [navigation])

    useEffect(() => {
        if (currentUser) {
            const filtered =
                statusFilter === "all"
                    ? orders.filter((order) =>
                        ["pending", "accepted", "rejected", "shipped", "delivered", "finalized"].includes(order.status),
                    )
                    : orders.filter((order) => order.status === statusFilter)
            setFilteredOrders(filtered)
        }
    }, [statusFilter, orders, currentUser])

    const fetchCustomerName = async (email) => {
        const db = getFirestore()
        try {
            const userRef = doc(db, "users", email)
            const userSnap = await getDoc(userRef)

            if (userSnap.exists()) {
                return userSnap.data().fullName || userSnap.data().displayName || email
            }
            return email
        } catch (error) {
            console.error("Error obteniendo nombre:", error)
            return email
        }
    }

    const fetchOrders = async (vendorEmail) => {
        if (!vendorEmail) return
        
        setLoading(true)
        const db = getFirestore()
        
        console.log("Buscando órdenes para:", vendorEmail)
        setDebugInfo(prev => `${prev}\nConsultando órdenes para: ${vendorEmail}`)

        try {
            // 1. Obtener todas las órdenes
            const allOrdersQuery = query(collection(db, "orders"))
            const querySnapshot = await getDocs(allOrdersQuery)
            
            // 2. Recopilar todos los emails de vendedor para diagnóstico
            const emailsFound = querySnapshot.docs
                .map(doc => doc.data().vendorEmail)
                .filter(email => email)
            
            const uniqueEmails = [...new Set(emailsFound)]
            setAllVendorEmails(uniqueEmails)
            
            // 3. Filtrar localmente ignorando mayúsculas/minúsculas
            const filteredOrders = querySnapshot.docs.filter(doc => {
                const orderData = doc.data()
                return orderData.vendorEmail && 
                       orderData.vendorEmail.toLowerCase() === vendorEmail.toLowerCase()
            })

            console.log("Órdenes encontradas:", filteredOrders.length)
            setDebugInfo(prev => `${prev}\nTotal órdenes: ${filteredOrders.length}`)

            const ordersData = []
            const namesCache = {}

            // Procesar cada documento filtrado
            for (const docSnap of filteredOrders) {
                const orderData = docSnap.data()
                const order = {
                    id: docSnap.id,
                    ...orderData,
                    items: orderData.items || []
                }

                ordersData.push(order)

                if (orderData.buyerEmail && !namesCache[orderData.buyerEmail]) {
                    namesCache[orderData.buyerEmail] = await fetchCustomerName(orderData.buyerEmail)
                }
            }

            // Ordenar por fecha más reciente primero
            ordersData.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0))

            setOrders(ordersData)
            setCustomerNames(namesCache)
            
            if (filteredOrders.length === 0) {
                setDebugInfo(prev => `${prev}\nADVERTENCIA: No se encontraron órdenes`)
                setDebugInfo(prev => `${prev}\nEmails de vendedor en sistema: ${uniqueEmails.join(", ")}`)
            }
        } catch (error) {
            console.error("Error al obtener órdenes:", error)
            setDebugInfo(prev => `${prev}\nERROR: ${error.message}`)
            
            if (error.code === 'failed-precondition') {
                Alert.alert(
                    "Error de consulta", 
                    "Necesitas crear un índice en Firestore para esta consulta. " +
                    "Ve a la consola de Firebase > Firestore > Índices y crea un índice para 'orders' con 'vendorEmail'."
                )
            } else {
                Alert.alert("Error", `No se pudieron cargar las órdenes: ${error.message}`)
            }
        } finally {
            setLoading(false)
        }
    }

    const formatDate = (timestamp) => {
        if (!timestamp?.toDate) return "Fecha no disponible"
        try {
            return timestamp.toDate().toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            })
        } catch (error) {
            console.error("Error formateando fecha:", error)
            return "Fecha inválida"
        }
    }

    const getProductsSummary = (items = []) => {
        if (items.length === 0) return "Sin productos"
        if (items.length === 1) {
            return `${items[0].productName} (${items[0].quantity} ${items[0].unitMeasure})`
        }
        return `${items.length} productos`
    }

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case "accepted": return "#4CAF50"
            case "rejected": return "#F44336"
            case "pending": return "#FFC107"
            case "shipped": return "#2196F3"
            case "delivered": return "#673AB7"
            case "finalized": return "#4CAF50"
            default: return "#9E9E9E"
        }
    }

    const renderOrder = (order) => (
        <Card
            key={order.id}
            style={styles.orderCard}
            onPress={() => navigation.navigate("OrderDetails", { orderId: order.id })}
        >
            <Card.Content>
                <Text style={styles.orderTitle}>Orden #{order.id.substring(0, 8)}</Text>
                <Text style={styles.orderText}>Fecha: {formatDate(order.createdAt)}</Text>
                <Text style={styles.orderText}>Productos: {getProductsSummary(order.items)}</Text>
                <Text style={styles.orderText}>Cliente: {customerNames[order.buyerEmail] || order.buyerEmail}</Text>
                <Text style={[styles.orderText, { color: getStatusColor(order.status) }]}>
                    Estado: {order.status?.charAt(0).toUpperCase() + order.status?.slice(1)}
                </Text>
                <Text style={styles.orderText}>Total: ${order.totalAmount?.toLocaleString() || "0"}</Text>

                {order.paymentDetails && (
                    <View style={styles.paymentDetails}>
                        <Text style={styles.paymentTitle}>Detalles de pago:</Text>
                        <Text style={styles.orderText}>Método: {order.paymentMethod || "Tarjeta"}</Text>
                        {order.paymentDetails.cardLast4 && (
                            <Text style={styles.orderText}>Tarjeta: •••• {order.paymentDetails.cardLast4}</Text>
                        )}
                    </View>
                )}
            </Card.Content>
        </Card>
    )

    const showDebugInfo = () => {
        Alert.alert(
            "Información de Depuración",
            `Usuario: ${currentUser?.email || "No autenticado"}\n\n` +
            `Órdenes totales: ${orders.length}\n` +
            `Órdenes filtradas: ${filteredOrders.length}\n` +
            `Filtro actual: ${statusFilter}\n\n` +
            `Emails de vendedor encontrados:\n${allVendorEmails.join("\n")}\n\n` +
            `Detalles:\n${debugInfo}`
        )
    }

    if (loading) {
        return (
            <View style={styles.container}>
                <Text style={styles.loadingText}>Cargando órdenes...</Text>
                <Button 
                    mode="contained" 
                    onPress={showDebugInfo} 
                    style={styles.debugButton}
                    loading={loading}
                >
                    Mostrar Info Debug
                </Button>
            </View>
        )
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <IconButton 
                    icon="arrow-left" 
                    iconColor="#FFFFFF" 
                    size={24} 
                    onPress={() => navigation.goBack()} 
                />
                <Text style={styles.title}>Mis Órdenes</Text>

                <Menu
                    visible={menuVisible}
                    onDismiss={() => setMenuVisible(false)}
                    anchor={
                        <Button
                            mode="contained"
                            onPress={() => setMenuVisible(true)}
                            style={styles.filterButton}
                            icon="filter"
                            labelStyle={{ color: "#FFFFFF" }}
                        >
                            {statusOptions.find(opt => opt.value === statusFilter)?.label}
                        </Button>
                    }
                >
                    {statusOptions.map((option) => (
                        <Menu.Item
                            key={option.value}
                            onPress={() => {
                                setStatusFilter(option.value)
                                setMenuVisible(false)
                            }}
                            title={option.label}
                            style={styles.menuItem}
                        />
                    ))}
                </Menu>
            </View>

            <ScrollView contentContainerStyle={styles.ordersContainer}>
                {filteredOrders.length > 0 ? (
                    filteredOrders.map(renderOrder)
                ) : (
                    <View style={styles.noOrdersContainer}>
                        <Text style={styles.noOrdersText}>No se encontraron órdenes</Text>
                        <Text style={styles.noOrdersSubtext}>
                            {currentUser 
                                ? `No hay órdenes para ${currentUser.email} con filtro "${statusFilter}"`
                                : "No estás autenticado"}
                        </Text>
                        
                        <Button 
                            mode="contained" 
                            onPress={() => currentUser && fetchOrders(currentUser.email)}
                            style={styles.refreshButton}
                        >
                            Reintentar
                        </Button>
                        
                        <Button 
                            mode="outlined" 
                            onPress={showDebugInfo} 
                            style={styles.debugButton}
                            textColor="#FFFFFF"
                        >
                            Mostrar Info Técnica
                        </Button>

                        {allVendorEmails.length > 0 && (
                            <Text style={styles.emailWarning}>
                                Emails de vendedor encontrados: {allVendorEmails.join(", ")}
                            </Text>
                        )}
                    </View>
                )}
            </ScrollView>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#263238",
        padding: 16,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 20,
        marginTop: 40,
    },
    title: {
        fontSize: 22,
        fontWeight: "bold",
        color: "#FFFFFF",
        marginLeft: 12,
        flex: 1,
    },
    filterButton: {
        backgroundColor: "#6200EE",
        borderRadius: 8,
        marginLeft: 8,
    },
    ordersContainer: {
        paddingBottom: 20,
    },
    orderCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 10,
        marginBottom: 16,
        elevation: 3,
    },
    orderTitle: {
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 8,
        color: "#333333",
    },
    orderText: {
        fontSize: 14,
        marginBottom: 4,
        color: "#555555",
    },
    noOrdersContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
        marginTop: 50,
    },
    noOrdersText: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#FFFFFF",
        marginBottom: 8,
        textAlign: "center",
    },
    noOrdersSubtext: {
        fontSize: 14,
        color: "#CCCCCC",
        textAlign: "center",
        marginBottom: 20,
        maxWidth: "80%",
    },
    loadingText: {
        fontSize: 16,
        color: "#FFFFFF",
        textAlign: "center",
        marginVertical: 20,
    },
    refreshButton: {
        backgroundColor: "#6200EE",
        marginTop: 16,
        width: "60%",
    },
    debugButton: {
        marginTop: 12,
        borderColor: "#FFFFFF",
        width: "60%",
    },
    paymentDetails: {
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: "#EEEEEE",
    },
    paymentTitle: {
        fontWeight: "bold",
        color: "#333333",
        marginBottom: 6,
    },
    menuItem: {
        paddingVertical: 8,
        paddingHorizontal: 16,
    },
    emailWarning: {
        fontSize: 12,
        color: "#FF9800",
        textAlign: "center",
        marginTop: 20,
        maxWidth: "90%",
    },
})

export default MyOrdersScreen