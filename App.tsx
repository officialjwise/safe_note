import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Provider } from 'react-redux';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { store } from '@store';
import { AppNavigator } from '@navigation';
import { COLORS } from '@constants';

const App: React.FC = (): React.JSX.Element => {
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: COLORS.primaryBackground }}>
      <Provider store={store}>
        <SafeAreaProvider>
          <AppNavigator />
        </SafeAreaProvider>
      </Provider>
    </GestureHandlerRootView>
  );
};

export default App;
