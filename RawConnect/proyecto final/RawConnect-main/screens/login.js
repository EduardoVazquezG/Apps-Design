import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Box, Input, NativeBaseProvider } from 'native-base';
import React, { useEffect, useState } from "react";
import { Dimensions, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Avatar, Button, Text } from 'react-native-paper';
import { auth, db, doc, getDoc, onAuthStateChanged, signInWithEmailAndPassword } from '../config/fb.js';

const { width, height } = Dimensions.get('window');

export default function Login({ navigation }) {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [displayText, setDisplayText] = useState({
    user: "",
    pass: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const docRef = doc(db, "Roles", currentUser.email);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const role = docSnap.data().role;
          if (role === 1) {
            navigation.navigate('MainBuyer');
          } else if (role === 2) {
            navigation.navigate('MainProducer');
          } else {
            setError("Invalid role assigned to this user.");
          }
        } else {
          setError("User not found in roles collection.");
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [navigation]);

  const handleLogin = async () => {
    if (!user || !pass) {
      setError("Please enter both email and password");
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, user, pass);
      const currentUser = userCredential.user;

      const docRef = doc(db, "Roles", currentUser.email);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const role = docSnap.data().role;

        if (role === 1) {
          navigation.navigate('MainBuyer');
        } else if (role === 2) {
          navigation.navigate('MainProducer');
        } else {
          setError("Invalid role assigned to this user.");
        }
      } else {
        setError("User not found in roles collection.");
      }
    } catch (error) {
      setError("Login failed. Please check your credentials.");
    }
  };


  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient
          colors={['#2c3e50', '#1a2530']}
          style={styles.loadingGradient}
        >
          <MaterialCommunityIcons name="loading" size={50} color="#fff" />
          <Text style={styles.loadingText}>Loading...</Text>
        </LinearGradient>
      </View>
    );
  }

  return (
    <NativeBaseProvider>
      <View style={styles.container}>
        <LinearGradient
          colors={['#2c3e50', '#1a2530', '#34495e']}
          style={styles.background}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          locations={[0, 0.7, 1]}
        >
          <View style={styles.patternOverlay} />

          <Box style={styles.cardContainer}>
            <View style={styles.cardGradient}>
              <View style={styles.logoContainer}>
                <Avatar.Image
                  size={100}
                  source={require('../assets/logo2.png')}
                  style={styles.avatar}
                  backgroundColor="transparent"
                />
                <LinearGradient
                  colors={['#2c3e50', '#34495e']}
                  style={styles.logoBackground}
                />
              </View>

              <Text style={styles.title}>Welcome Back</Text>
              <Text style={styles.subtitle}>Sign in to continue</Text>

              <View style={styles.inputContainer}>
                <View style={styles.inputWrapper}>
                  <MaterialCommunityIcons name="email-outline" size={20} color="#2c3e50" style={styles.inputIcon} />
                  <Input
                    variant="unstyled"
                    placeholder="Email"
                    value={user}
                    onChangeText={setUser}
                    style={styles.input}
                    placeholderTextColor="#999"
                    autoCapitalize="none"
                  />
                </View>

                <View style={styles.inputWrapper}>
                  <MaterialCommunityIcons name="lock-outline" size={20} color="#2c3e50" style={styles.inputIcon} />
                  <Input
                    variant="unstyled"
                    placeholder="Password"
                    value={pass}
                    onChangeText={setPass}
                    style={styles.input}
                    secureTextEntry={!showPassword}
                    placeholderTextColor="#999"
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                    <MaterialCommunityIcons
                      name={showPassword ? "eye-off-outline" : "eye-outline"}
                      size={20}
                      color="#2c3e50"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {error ? (
                <View style={styles.errorContainer}>
                  <MaterialCommunityIcons name="alert-circle" size={16} color="#e74c3c" />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
                <LinearGradient
                  colors={['#2c3e50', '#34495e']}
                  style={styles.loginButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.loginButtonText}>SIGN IN</Text>
                </LinearGradient>
              </TouchableOpacity>

              <View style={styles.registerContainer}>
                <Text style={styles.registerText}>Don't have an account? </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                  <Text style={styles.registerLink}>Register</Text>
                </TouchableOpacity>
              </View>

             
            </View>
          </Box>

          <StatusBar style="light" />
        </LinearGradient>
      </View>
    </NativeBaseProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a2530',
  },
  patternOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    opacity: 0.2,
  },
  cardContainer: {
    width: width > 500 ? 400 : width * 0.9,
    maxHeight: height * 0.8,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  cardGradient: {
    padding: 20,
    alignItems: 'center',
    borderRadius: 20,
  },
  logoContainer: {
    marginTop: 20,
    marginBottom: 10,
    alignItems: 'center',
    justifyContent: 'center',
    width: 120,
    height: 120,
    borderRadius: 60,
    position: 'relative',
  },
  logoBackground: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    zIndex: -1,
    borderWidth: 2,
    borderColor: '#34495e',
  },
  avatar: {
    backgroundColor: 'transparent',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginTop: 20,
  },
  subtitle: {
    fontSize: 16,
    color: '#7f8c8d',
    marginBottom: 30,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 20,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 10,
    paddingHorizontal: 10,
    marginBottom: 20,
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#2c3e50',
  },
  eyeIcon: {
    padding: 5,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(231, 76, 60, 0.1)',
    padding: 10,
    borderRadius: 5,
    marginBottom: 20,
    width: '100%',
  },
  errorText: {
    color: '#e74c3c',
    marginLeft: 5,
    fontSize: 14,
  },
  loginButton: {
    width: '100%',
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
    marginBottom: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  loginButtonGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  registerContainer: {
    flexDirection: 'row',
    marginBottom: 30,
  },
  registerText: {
    color: '#7f8c8d',
  },
  registerLink: {
    color: '#2980b9',
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
  predefinedButtonsContainer: {
    width: '100%',
    marginBottom: 20,
  },
  predefinedButton: {
    marginBottom: 10,
    borderColor: '#34495e',
    borderWidth: 1,
    borderRadius: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: 'white',
    marginTop: 10,
    fontSize: 18,
  },
});