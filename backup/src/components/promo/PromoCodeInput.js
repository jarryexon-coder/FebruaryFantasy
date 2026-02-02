import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import promoService from '../../services/promoService';

const PromoCodeInput = ({ onApply, userId }) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [validatedCode, setValidatedCode] = useState(null);
  const [message, setMessage] = useState('');

  const handleValidate = async () => {
    if (!code.trim()) {
      Alert.alert('Error', 'Please enter a promo code');
      return;
    }

    try {
      setValidating(true);
      setMessage('Validating...');
      const result = await promoService.validatePromoCode(code.trim().toUpperCase());
      
      if (result.valid) {
        setValidatedCode(result.promoCode);
        setMessage(`✅ Valid: ${result.promoCode.description}`);
        Alert.alert(
          'Valid Code!',
          `${result.promoCode.code}: ${result.promoCode.description}\n` +
          `Discount: ${result.promoCode.discount_value}${result.promoCode.discount_type === 'percentage' ? '%' : 
            result.promoCode.discount_type === 'trial' ? '-day trial' : ' off'}`
        );
      } else {
        setValidatedCode(null);
        setMessage(`❌ ${result.message || 'Invalid code'}`);
        Alert.alert('Invalid Code', result.message || 'This promo code is not valid');
      }
    } catch (error) {
      setMessage(`❌ Error: ${error.message}`);
      Alert.alert('Error', error.message || 'Failed to validate promo code');
    } finally {
      setValidating(false);
    }
  };

  const handleApply = async () => {
    if (!code.trim()) {
      Alert.alert('Error', 'Please enter a promo code');
      return;
    }

    if (!userId) {
      Alert.alert('Error', 'User ID is required to apply promo code');
      return;
    }

    try {
      setLoading(true);
      setMessage('Applying...');
      const result = await promoService.applyPromoCode(code.trim().toUpperCase(), userId);
      
      if (result.success) {
        setMessage(`✅ ${result.message}`);
        Alert.alert('Success!', result.message);
        setCode('');
        setValidatedCode(null);
        // Call parent callback if provided
        if (onApply) {
          onApply(result);
        }
      } else {
        setMessage(`❌ ${result.error || 'Failed to apply promo code'}`);
        Alert.alert('Error', result.error || 'Failed to apply promo code');
      }
    } catch (error) {
      setMessage(`❌ Error: ${error.message}`);
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Apply Promo Code</Text>
      
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={code}
          onChangeText={setCode}
          placeholder="Enter promo code (e.g., WELCOME10)"
          placeholderTextColor="#999"
          autoCapitalize="characters"
          editable={!loading && !validating}
        />
        
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.button, styles.validateButton]}
            onPress={handleValidate}
            disabled={validating || loading}
          >
            {validating ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.buttonText}>Validate</Text>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.button, styles.applyButton, (!validatedCode || loading) && styles.disabledButton]}
            onPress={handleApply}
            disabled={loading || !validatedCode}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.buttonText}>Apply</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {message ? (
        <Text style={[
          styles.message,
          message.includes('✅') ? styles.successMessage : 
          message.includes('❌') ? styles.errorMessage : 
          styles.infoMessage
        ]}>
          {message}
        </Text>
      ) : null}

      {validatedCode && (
        <View style={styles.validatedContainer}>
          <Text style={styles.validatedTitle}>Validated Code:</Text>
          <Text style={styles.codeName}>{validatedCode.code}</Text>
          <Text style={styles.codeDescription}>{validatedCode.description}</Text>
          <View style={styles.detailsRow}>
            <Text style={styles.discountText}>
              {validatedCode.discount_type === 'percentage' ? `${validatedCode.discount_value}% OFF` :
               validatedCode.discount_type === 'trial' ? `${validatedCode.discount_value}-day trial` :
               `$${validatedCode.discount_value} OFF`}
            </Text>
            <Text style={styles.usageText}>
              Uses: {validatedCode.uses_count}/{validatedCode.max_uses || '∞'}
            </Text>
          </View>
        </View>
      )}

      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>Available Promo Codes:</Text>
        <Text style={styles.infoText}>• WELCOME10 - 10% off for new users</Text>
        <Text style={styles.infoText}>• TRIAL7 - 7-day premium trial</Text>
        <Text style={styles.infoText}>• NBAGURU20 - 20% influencer discount</Text>
        <Text style={styles.infoText}>• BALLISLIFE15 - 15% community discount</Text>
        <Text style={styles.infoText}>• ELITE50 - 50% off Elite tier</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#f8f9fa',
    marginBottom: 12,
    color: '#212529',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  validateButton: {
    backgroundColor: '#6c757d',
  },
  applyButton: {
    backgroundColor: '#28a745',
  },
  disabledButton: {
    backgroundColor: '#cccccc',
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  message: {
    marginTop: 12,
    fontSize: 14,
    textAlign: 'center',
    padding: 8,
    borderRadius: 6,
  },
  successMessage: {
    color: '#155724',
    backgroundColor: '#d4edda',
    borderWidth: 1,
    borderColor: '#c3e6cb',
  },
  errorMessage: {
    color: '#721c24',
    backgroundColor: '#f8d7da',
    borderWidth: 1,
    borderColor: '#f5c6cb',
  },
  infoMessage: {
    color: '#0c5460',
    backgroundColor: '#d1ecf1',
    borderWidth: 1,
    borderColor: '#bee5eb',
  },
  validatedContainer: {
    backgroundColor: '#e8f5e9',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#c3e6cb',
  },
  validatedTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#155724',
    marginBottom: 8,
  },
  codeName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 4,
  },
  codeDescription: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 8,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  discountText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#28a745',
  },
  usageText: {
    fontSize: 14,
    color: '#6c757d',
  },
  infoBox: {
    backgroundColor: '#e7f5ff',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#a5d8ff',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1864ab',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#1864ab',
    lineHeight: 20,
  },
});

export default PromoCodeInput;
