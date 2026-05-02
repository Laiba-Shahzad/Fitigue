import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, Image, Alert,
} from 'react-native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '../../constants/Colors';

const SIZES = ['XS', 'S', 'M', 'L', 'XL'];
const CATEGORIES = ['Shirt', 'Pants', 'Dress', 'Shoes', 'Scarf', 'Jacket', 'Other'];

export default function AddScreen() {
  const [image, setImage] = useState<string | null>(null);
  const [size, setSize] = useState('');
  const [category, setCategory] = useState('Shirt');
  const [sell, setSell] = useState(false);
  const [swap, setSwap] = useState(false);
  const [form, setForm] = useState({
    name: '', description: '', price: '', colour: '',
  });

  const update = (k: keyof typeof form, v: string) =>
    setForm(p => ({ ...p, [k]: v }));

  // Shows popup: Camera or Gallery
  const pickImage = () => {
    Alert.alert(
      'Add Photo',
      'Choose an option',
      [
        { text: 'Take Photo', onPress: openCamera },
        { text: 'Choose from Gallery', onPress: openGallery },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const openCamera = async () => {
    // Ask for camera permission
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Please allow camera access to take photos.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,   // lets user crop
      aspect: [4, 4],        // square crop
      quality: 0.8,          // 80% quality to save space
    });
    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const openGallery = async () => {
    // Ask for gallery permission
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Please allow gallery access to choose photos.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 4],
      quality: 0.8,
    });
    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>Add to Wardrobe</Text>

      {/* Image picker — shows preview once selected */}
      <TouchableOpacity style={styles.imgPicker} onPress={pickImage}>
        {image ? (
          <>
            <Image source={{ uri: image }} style={styles.preview} />
            <View style={styles.changeOverlay}>
              <Text style={styles.changeText}>Tap to change</Text>
            </View>
          </>
        ) : (
          <>
            <Ionicons name="camera-outline" size={44} color={Colors.accent} />
            <Text style={styles.imgText}>Take / Insert Image</Text>
            <Text style={styles.imgSubText}>Camera or Gallery</Text>
          </>
        )}
      </TouchableOpacity>

      <Text style={styles.label}>Item Name:</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. Maroon Shirt"
        placeholderTextColor={Colors.card}
        value={form.name}
        onChangeText={v => update('name', v)}
      />

      <Text style={styles.label}>Description:</Text>
      <TextInput
        style={[styles.input, styles.area]}
        placeholder="Describe your item..."
        placeholderTextColor={Colors.card}
        multiline
        numberOfLines={4}
        textAlignVertical="top"
        value={form.description}
        onChangeText={v => update('description', v)}
      />

      <Text style={styles.label}>Price:</Text>
      <TextInput
        style={styles.input}
        placeholder="Rs 0"
        placeholderTextColor={Colors.card}
        keyboardType="numeric"
        value={form.price}
        onChangeText={v => update('price', v)}
      />

      <Text style={styles.label}>Size:</Text>
      <View style={styles.sizeRow}>
        {SIZES.map(s => (
          <TouchableOpacity
            key={s}
            style={[styles.sizeBtn, size === s && styles.sizeBtnOn]}
            onPress={() => setSize(s)}
          >
            <Text style={[styles.sizeTxt, size === s && styles.sizeTxtOn]}>{s}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Colour:</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. Maroon"
        placeholderTextColor={Colors.card}
        value={form.colour}
        onChangeText={v => update('colour', v)}
      />

      <Text style={styles.label}>Category:</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.catRow}>
          {CATEGORIES.map(c => (
            <TouchableOpacity
              key={c}
              style={[styles.catBtn, category === c && styles.catBtnOn]}
              onPress={() => setCategory(c)}
            >
              <Text style={[styles.catTxt, category === c && styles.catTxtOn]}>{c}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <View style={styles.checkRow}>
        <TouchableOpacity style={styles.check} onPress={() => setSell(!sell)}>
          <View style={[styles.box, sell && styles.boxOn]} />
          <Text style={styles.checkLabel}>Sell</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.check} onPress={() => setSwap(!swap)}>
          <View style={[styles.box, swap && styles.boxOn]} />
          <Text style={styles.checkLabel}>Swap</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.submitBtn}>
        <Text style={styles.submitTxt}>Add Item</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: 20, paddingTop: 56, gap: 10, paddingBottom: 50 },
  title: {
    fontSize: 28, fontWeight: '900', color: Colors.deep,
    fontStyle: 'italic', marginBottom: 10,
  },
  imgPicker: {
    height: 200, backgroundColor: Colors.card, borderRadius: 16,
    borderWidth: 2, borderColor: Colors.accent, borderStyle: 'dashed',
    justifyContent: 'center', alignItems: 'center', gap: 8,
    overflow: 'hidden',
  },
  preview: {
    width: '100%', height: '100%',
    position: 'absolute', top: 0, left: 0,
  },
  changeOverlay: {
    backgroundColor: 'rgba(84,8,99,0.45)',
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10,
  },
  changeText: { color: Colors.white, fontWeight: '800', fontSize: 15 },
  imgText: { color: Colors.deep, fontWeight: '700', fontSize: 16 },
  imgSubText: { color: Colors.accent, fontSize: 13, fontWeight: '600' },
  label: { fontSize: 15, fontWeight: '800', color: Colors.deep, marginTop: 4 },
  input: {
    backgroundColor: Colors.white, borderRadius: 10, padding: 13,
    fontSize: 15, borderWidth: 1.5, borderColor: Colors.card, color: Colors.deep,
  },
  area: { height: 90 },
  sizeRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  sizeBtn: {
    paddingHorizontal: 16, paddingVertical: 9, borderRadius: 20,
    borderWidth: 2, borderColor: Colors.accent, backgroundColor: Colors.white,
  },
  sizeBtnOn: { backgroundColor: Colors.accent },
  sizeTxt: { color: Colors.accent, fontWeight: '800' },
  sizeTxtOn: { color: Colors.white },
  catRow: { flexDirection: 'row', gap: 8 },
  catBtn: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    borderWidth: 2, borderColor: Colors.accent, backgroundColor: Colors.white,
  },
  catBtnOn: { backgroundColor: Colors.accent },
  catTxt: { color: Colors.accent, fontWeight: '700', fontSize: 13 },
  catTxtOn: { color: Colors.white },
  checkRow: { flexDirection: 'row', gap: 36, marginTop: 6 },
  check: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  box: {
    width: 22, height: 22, borderRadius: 5,
    borderWidth: 2, borderColor: Colors.deep, backgroundColor: Colors.white,
  },
  boxOn: { backgroundColor: Colors.accent },
  checkLabel: { fontSize: 16, fontWeight: '800', color: Colors.deep },
  submitBtn: {
    backgroundColor: Colors.deep, borderRadius: 14,
    padding: 16, alignItems: 'center', marginTop: 14,
  },
  submitTxt: { color: Colors.white, fontSize: 18, fontWeight: '900' },
});