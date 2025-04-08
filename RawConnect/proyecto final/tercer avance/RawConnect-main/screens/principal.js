import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Button, NativeBaseProvider } from 'native-base';
import React from 'react';
import { Animated, Dimensions, Image, StyleSheet, Text, View } from 'react-native';
import Footer from '../components/Footer';

const { width, height } = Dimensions.get('window');

const Principal = ({ navigation }) => {
  const fadeAnim = new Animated.Value(0);

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <NativeBaseProvider>
      <LinearGradient
        colors={['#ffffff', '#f8f9fa', '#e9ecef']}
        style={styles.container}
      >
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          { }
          <View style={styles.logoContainer}>
            <Image
              source={require('../assets/logo2.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>

          <Text style={styles.title}>Welcome to</Text>
          <Text style={styles.brand}>RawConnect</Text>

          <View style={styles.patternContainer}>
            <View style={[styles.patternLine, styles.patternLine1]} />
            <View style={[styles.patternLine, styles.patternLine2]} />
            <View style={styles.patternDotGrid} />
          </View>

          <Button
            style={styles.button}
            onPress={() => navigation.navigate('Register')}
            bg="#2c3e50"
            _pressed={{ bg: '#34495e' }}
            endIcon={<MaterialIcons name="arrow-forward" size={24} color="white" />}
          >
            Get Started
          </Button>
        </Animated.View>

        <Footer />
      </LinearGradient>
    </NativeBaseProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    padding: 30,
    borderRadius: 20,
    width: width * 0.85,
  },
  logoContainer: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(44, 62, 80, 0.1)',
    borderWidth: 2,
    borderColor: '#2c3e50',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    overflow: 'hidden',
  },
  logoImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  title: {
    fontSize: 28,
    color: '#2c3e50',
    letterSpacing: 1.5,
    fontWeight: '300',
    marginBottom: 10,
  },
  brand: {
    fontSize: 42,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 40,
    letterSpacing: 1,
  },
  patternContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    zIndex: -1,
  },
  patternLine: {
    position: 'absolute',
    backgroundColor: 'rgba(44, 62, 80, 0.05)',
    height: 2,
  },
  patternLine1: {
    width: '130%',
    transform: [{ rotate: '-30deg' }],
    top: '40%',
    left: '-15%',
  },
  patternLine2: {
    width: '120%',
    transform: [{ rotate: '25deg' }],
    top: '60%',
    left: '-10%',
  },
  patternDotGrid: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    opacity: 0.3,
  },
  button: {
    borderRadius: 50,
    paddingHorizontal: 40,
    marginTop: 30,
    shadowColor: '#2c3e50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
});

export default Principal;