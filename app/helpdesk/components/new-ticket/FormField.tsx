import React from 'react';
import { View, Text, StyleSheet, TextInput, Dimensions } from 'react-native';
import { Picker } from '@react-native-picker/picker';

// Get screen width for responsive design
const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface TextFieldProps {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  required?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
}

interface PickerFieldProps {
  label: string;
  value: any;
  onValueChange: (value: any) => void;
  items: Array<{ label: string; value: any }>;
  enabled?: boolean;
  required?: boolean;
}

export const TextField: React.FC<TextFieldProps> = ({ 
  label, 
  placeholder, 
  value, 
  onChangeText, 
  required = false,
  multiline = false,
  numberOfLines = 1
}) => {
  return (
    <View style={styles.formGroup}>
      <Text style={styles.label}>
        {label}
        {required && <Text style={styles.required}> *</Text>}
      </Text>
      <TextInput 
        style={[
          styles.input, 
          multiline && { 
            height: numberOfLines * SCREEN_WIDTH * 0.12,
            textAlignVertical: 'top'
          }
        ]} 
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        multiline={multiline}
        numberOfLines={multiline ? numberOfLines : 1}
      />
    </View>
  );
};

export const PickerField: React.FC<PickerFieldProps> = ({ 
  label, 
  value, 
  onValueChange, 
  items, 
  enabled = true,
  required = false
}) => {
  return (
    <View style={styles.formGroup}>
      <Text style={styles.label}>
        {label}
        {required && <Text style={styles.required}> *</Text>}
      </Text>
      <View style={[styles.pickerContainer, !enabled && styles.disabledPicker]}>
        <Picker
          selectedValue={value}
          onValueChange={onValueChange}
          style={styles.picker}
          enabled={enabled}
        >
          {items.map((item, index) => (
            <Picker.Item key={index} label={item.label} value={item.value} />
          ))}
        </Picker>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  formGroup: {
    marginBottom: SCREEN_WIDTH * 0.04,
  },
  label: {
    fontSize: SCREEN_WIDTH * 0.035,
    fontWeight: 'bold',
    marginBottom: SCREEN_WIDTH * 0.02,
    color: '#333',
  },
  required: {
    color: 'red',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: SCREEN_WIDTH * 0.03,
    paddingVertical: SCREEN_WIDTH * 0.03,
    fontSize: SCREEN_WIDTH * 0.04,
    height: SCREEN_WIDTH * 0.15,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    overflow: 'hidden',
    height: SCREEN_WIDTH * 0.15,
  },
  disabledPicker: {
    backgroundColor: '#F5F5F5',
    opacity: 0.7,
  },
  picker: {
    height: SCREEN_WIDTH * 0.15,
    width: '100%',
  },
}); 