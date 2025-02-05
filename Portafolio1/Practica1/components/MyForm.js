import React, { useState } from "react";
import { StyleSheet, View, Text, TextInput, TouchableOpacity } from "react-native";

export default function MyForm() {
  const [text, setText] = useState("");
  const [displayText, setDisplayText] = useState("");

  const handlePress = () => {
    setDisplayText(text);
    setText("");
  };

  return (
    <View style={styleForm.form}>
      <TextInput
        style={styleForm.input}
        placeholder="Escribe aquí..."
        placeholderTextColor="#999"
        value={text}
        onChangeText={setText}
      />
      <TouchableOpacity style={styleForm.button} onPress={handlePress}>
        <Text style={styleForm.buttonText}>Enviar</Text>
      </TouchableOpacity>
      <Text style={styleForm.textResult}>{displayText}</Text>
    </View>
  );
}

const styleForm = StyleSheet.create({
  form: {
    backgroundColor: "#e3f2fd",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    width: "100%",
    height: "100%",
  },
  input: {
    width: "85%",
    marginVertical: 15,
    padding: 12,
    borderWidth: 2,
    borderColor: "#0288d1",
    borderRadius: 12,
    fontSize: 18,
    backgroundColor: "#fff",
    textAlign: "left",
    color: "#333",
  },
  button: {
    width: "70%",
    padding: 14,
    backgroundColor: "#0288d1",
    borderRadius: 12,
    alignItems: "center",
    marginVertical: 10,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  textResult: {
    padding: 10,
    fontSize: 20,
    color: "#01579b",
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 10,
  },
});
