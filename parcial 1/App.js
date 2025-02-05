import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Image } from 'react-native';

const App = () => {
  const [id, setId] = useState('');
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    setSubmitted(true);
  };

  return (
    <View style={styles.container}>
      <View style={styles.formContainer}>
        <Image source={require('./assets/nfl_logo.png')} style={styles.logo} />
        
        <Text style={styles.title}>Registro NFL GamePass</Text>

        <TextInput style={styles.input} placeholder="ID" value={id} onChangeText={setId} />
        <TextInput style={styles.input} placeholder="Nombre" value={nombre} onChangeText={setNombre} />
        <TextInput style={styles.input} placeholder="Email" keyboardType="email-address" value={email} onChangeText={setEmail} />
        <TextInput style={styles.input} placeholder="Teléfono" keyboardType="phone-pad" value={phone} onChangeText={setPhone} />

        <Button title="Registrar" onPress={handleSubmit} color="#FFD700" />

        {submitted && (
          <View style={styles.result}>
            <Text style={styles.resultText}>ID: {id}</Text>
            <Text style={styles.resultText}>Nombre: {nombre}</Text>
            <Text style={styles.resultText}>Email: {email}</Text>
            <Text style={styles.resultText}>Teléfono: {phone}</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  formContainer: {
    width: '90%',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 20,
    resizeMode: 'contain',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#FFD700',
  },
  input: {
    borderWidth: 1,
    borderColor: '#FFD700',
    padding: 12,
    marginBottom: 15,
    borderRadius: 5,
    backgroundColor: '#FFF',
    color: '#000',
    width: '100%',
    textAlign: 'center',
  },
  result: {
    marginTop: 20,
    padding: 10,
    borderWidth: 1,
    borderColor: '#FFD700',
    borderRadius: 5,
    backgroundColor: '#FFF',
    width: '100%',
    alignItems: 'center',
  },
  resultText: {
    color: '#000',
  },
});

export default App;
