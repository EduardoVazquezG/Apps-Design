

import { MaterialIcons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { Box, NativeBaseProvider, Pressable, Text, extendTheme } from "native-base";
import React from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import { SceneMap, TabView } from "react-native-tab-view";
import Reg from "../components/formReg";

const theme = extendTheme({
  colors: {
    cyan: {
      500: "#263238",
      600: "#263238",
    },
    coolGray: {
      400: "#9ca3af",
    }
  },
  components: {
    Text: {
      baseStyle: {
        fontFamily: "Inter",
      },
    },
  },
});

export default function Register() {
  const FirstRoute = () => (
    <Box flex={1} my="4">
      <View style={styles.glassCard}>
        <Reg isProducer={false} />
      </View>
    </Box>
  );

  const SecondRoute = () => (
    <Box flex={1} my="4">
      <View style={styles.glassCard}>
        <Reg isProducer={true} />
      </View>
    </Box>
  );

  const initialLayout = { width: Dimensions.get("window").width };

  const renderScene = SceneMap({ first: FirstRoute, second: SecondRoute });

  function Add() {
    const [index, setIndex] = React.useState(0);
    const [routes] = React.useState([
      { key: "first", title: "Buyer", icon: "shopping-cart" },
      { key: "second", title: "Producer", icon: "local-florist" },
    ]);

    const renderTabBar = (props) => {
      return (
        <Box flexDirection="row" style={styles.tabBar}>
          {props.navigationState.routes.map((route, i) => {
            const isActive = index === i;
            return (
              <Pressable
                key={i}
                onPress={() => setIndex(i)}
                style={[styles.tabButton, isActive && styles.activeTab]}
              >
                <MaterialIcons
                  name={route.icon}
                  size={24}
                  color={isActive ? theme.colors.cyan[500] : theme.colors.coolGray[400]}
                  style={styles.tabIcon}
                />
                <Text
                  fontSize="md"
                  fontWeight="bold"
                  color={isActive ? "cyan.500" : "coolGray.400"}
                  style={styles.tabText}
                >
                  {route.title}
                </Text>
              </Pressable>
            );
          })}
        </Box>
      );
    };

    return (
      <TabView
        navigationState={{ index, routes }}
        renderScene={renderScene}
        renderTabBar={renderTabBar}
        onIndexChange={setIndex}
        initialLayout={initialLayout}
        style={styles.tabView}
      />
    );
  }

  return (
    <NativeBaseProvider theme={theme}>
      <View style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.content}>
          <Text
            fontSize="4xl"
            fontWeight="extrabold"
            color="cyan.600"
            style={styles.title}
          >
            Join Us
          </Text>
          <Add />
        </View>
      </View>
    </NativeBaseProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    paddingTop: 50,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 25,
  },
  title: {
    letterSpacing: -1.5,
    marginBottom: 30,
    textShadowColor: 'rgba(8, 145, 178, 0.1)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 10,
  },
  glassCard: {
    width: '100%',
    backgroundColor: 'white',
    borderRadius: 25,
    padding: 30,
    shadowColor: '#rgba(0, 0, 0, 0.1)',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 30,
    elevation: 10,
  },
  tabBar: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 20,
    padding: 5,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(8, 145, 178, 0.1)',
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 15,
    backgroundColor: 'transparent',
  },
  activeTab: {
    backgroundColor: 'rgba(8, 145, 178, 0.05)',
  },
  tabIcon: {
    marginRight: 10,
  },
  tabText: {
    letterSpacing: -0.5,
  },
  tabView: {
    width: '100%',
    maxWidth: 500,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
  },
});