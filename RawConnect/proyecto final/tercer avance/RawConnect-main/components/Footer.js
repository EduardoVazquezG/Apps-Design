import { StyleSheet, Text, View } from "react-native"

const Footer = () => {
  return (
    <View style={styles.footer}>
      <Text style={styles.footerText}>© 2024 RawConnect. All rights reserved.</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    width: "100%",
    backgroundColor: "#2c3e50",
    paddingVertical: 15,
    alignItems: "center",
  },
  footerText: {
    color: "white",
    fontSize: 12,
  },
})

export default Footer

