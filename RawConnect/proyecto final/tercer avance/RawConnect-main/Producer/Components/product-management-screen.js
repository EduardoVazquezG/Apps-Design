"use client"

import { useNavigation, useRoute } from "@react-navigation/native"
import { LinearGradient } from "expo-linear-gradient"
import { StatusBar } from "expo-status-bar"
import { useEffect, useState } from "react"
import { Animated, Dimensions, ImageBackground, StyleSheet, View } from "react-native"
import { Card, IconButton, Surface, Text, useTheme } from "react-native-paper"

const { width } = Dimensions.get("window")

const ProductManagementScreen = () => {
    const theme = useTheme()
    const navigation = useNavigation()
    const route = useRoute()
    const { userData } = route.params

    const [fadeAnim] = useState(new Animated.Value(0))
    const [slideAnim1] = useState(new Animated.Value(50))
    const [slideAnim2] = useState(new Animated.Value(50))
    const [slideAnim3] = useState(new Animated.Value(50))

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
        }).start()

        Animated.stagger(150, [
            Animated.timing(slideAnim1, {
                toValue: 0,
                duration: 600,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim2, {
                toValue: 0,
                duration: 600,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim3, {
                toValue: 0,
                duration: 600,
                useNativeDriver: true,
            }),
        ]).start()
    }, [])

    return (
        <View style={styles.container}>
            <StatusBar style="light" />
            <ImageBackground
                source={{ uri: "https://i.imgur.com/JFHjdNr.png" }}
                style={styles.backgroundPattern}
                imageStyle={styles.backgroundImage}
            >
                <LinearGradient colors={["rgba(44, 62, 80, 0.9)", "rgba(44, 62, 80, 0.98)"]} style={styles.gradient}>
                    <View style={styles.header}>
                        <IconButton
                            icon="arrow-left"
                            iconColor="#FFFFFF"
                            size={28}
                            style={styles.backButton}
                            onPress={() => navigation.goBack()}
                        />
                        <Text style={styles.title}>Product Management</Text>
                    </View>

                    <View style={styles.divider}>
                        <View style={styles.dividerLine} />
                        <IconButton icon="cube-outline" size={16} iconColor="#e67e22" style={styles.dividerIcon} />
                        <View style={styles.dividerLine} />
                    </View>

                    <View style={styles.actionCards}>
                        <Animated.View
                            style={[styles.cardContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim1 }] }]}
                        >
                            <Surface style={styles.cardSurface} elevation={6}>
                                <Card
                                    style={styles.card}
                                    onPress={() => navigation.navigate("AddProduct", { userData })}
                                    mode="elevated"
                                >
                                    <LinearGradient
                                        colors={["#1a5276", "#21618c"]}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 1 }}
                                        style={styles.cardGradient}
                                    >
                                        <Card.Content style={styles.cardContent}>
                                            <View style={styles.iconContainer}>
                                                <IconButton icon="plus-circle" iconColor="#FFFFFF" size={40} style={styles.cardIcon} />
                                                <View style={styles.iconGlow} />
                                            </View>
                                            <Text style={styles.cardTitle}>Add Product</Text>
                                            <Text style={styles.cardDescription}>
                                                Create a new product listing with details and specifications
                                            </Text>
                                            <View style={styles.cardAction}>
                                            </View>
                                        </Card.Content>
                                    </LinearGradient>
                                </Card>
                            </Surface>
                        </Animated.View>

                        <Animated.View
                            style={[styles.cardContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim2 }] }]}
                        >
                            <Surface style={styles.cardSurface} elevation={6}>
                                <Card
                                    style={styles.card}
                                    onPress={() => navigation.navigate("MyProducts", { userData })}
                                    mode="elevated"
                                >
                                    <LinearGradient
                                        colors={["#1a5276", "#21618c"]}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 1 }}
                                        style={styles.cardGradient}
                                    >
                                        <Card.Content style={styles.cardContent}>
                                            <View style={styles.iconContainer}>
                                                <IconButton icon="pencil-circle" iconColor="#FFFFFF" size={40} style={styles.cardIcon} />
                                                <View style={styles.iconGlow} />
                                            </View>
                                            <Text style={styles.cardTitle}>Edit Product</Text>
                                            <Text style={styles.cardDescription}>Modify existing product information and specifications</Text>
                                            <View style={styles.cardAction}>
                                            </View>
                                        </Card.Content>
                                    </LinearGradient>
                                </Card>
                            </Surface>
                        </Animated.View>

                        <Animated.View
                            style={[styles.cardContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim3 }] }]}
                        >
                            <Surface style={styles.cardSurface} elevation={6}>
                                <Card
                                    style={styles.card}
                                    onPress={() => navigation.navigate("DeleteProduct", { userData })}
                                    mode="elevated"
                                >
                                    <LinearGradient
                                        colors={["#1a5276", "#21618c"]}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 1 }}
                                        style={styles.cardGradient}
                                    >
                                        <Card.Content style={styles.cardContent}>
                                            <View style={styles.iconContainer}>
                                                <IconButton icon="delete-circle" iconColor="#FFFFFF" size={40} style={styles.cardIcon} />
                                                <View style={styles.iconGlow} />
                                            </View>
                                            <Text style={styles.cardTitle}>Delete Product</Text>
                                            <Text style={styles.cardDescription}>Remove products that are no longer available</Text>
                                            <View style={styles.cardAction}>
                                            </View>
                                        </Card.Content>
                                    </LinearGradient>
                                </Card>
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
        width: "100%",
    },
    backgroundImage: {
        opacity: 0.15,
    },
    gradient: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 40,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 20,
    },
    backButton: {
        backgroundColor: "rgba(52, 73, 94, 0.5)",
        margin: 0,
    },
    title: {
        fontSize: 26,
        fontWeight: "bold",
        color: "#FFFFFF",
        marginLeft: 10,
        letterSpacing: 0.5,
        textShadowColor: "rgba(0, 0, 0, 0.3)",
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 3,
    },
    divider: {
        flexDirection: "row",
        alignItems: "center",
        marginVertical: 20,
        width: "90%",
        alignSelf: "center",
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: "#e67e22",
    },
    dividerIcon: {
        margin: 0,
    },
    actionCards: {
        flex: 1,
        justifyContent: "center",
        paddingBottom: 40,
    },
    cardContainer: {
        marginBottom: 20,
    },
    cardSurface: {
        borderRadius: 16,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: "rgba(236, 240, 241, 0.1)",
    },
    card: {
        borderRadius: 16,
        overflow: "hidden",
        elevation: 0,
    },
    cardGradient: {
        borderRadius: 16,
        overflow: "hidden",
    },
    cardContent: {
        padding: 20,
        position: "relative",
    },
    iconContainer: {
        alignSelf: "center",
        marginBottom: 10,
        position: "relative",
    },
    cardIcon: {
        margin: 0,
        backgroundColor: "rgba(41, 128, 185, 0.4)",
        borderRadius: 30,
    },
    iconGlow: {
        position: "absolute",
        top: -5,
        left: -5,
        right: -5,
        bottom: -5,
        borderRadius: 40,
        backgroundColor: "rgba(41, 128, 185, 0.25)",
        zIndex: -1,
    },
    cardTitle: {
        fontSize: 20,
        fontWeight: "bold",
        marginBottom: 10,
        color: "#FFFFFF",
        textAlign: "center",
        letterSpacing: 0.5,
    },
    cardDescription: {
        fontSize: 14,
        color: "#ecf0f1",
        textAlign: "center",
        lineHeight: 20,
    },
    cardAction: {
        position: "absolute",
        right: 10,
        bottom: 10,
    },
    footer: {
        alignItems: "center",
        marginBottom: 20,
    },
    footerText: {
        color: "#95a5a6",
        fontSize: 12,
    },
})

export default ProductManagementScreen

