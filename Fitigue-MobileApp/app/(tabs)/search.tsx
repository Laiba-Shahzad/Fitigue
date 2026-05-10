import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, FlatList, ScrollView, Dimensions,
  Modal, Animated, Pressable, Platform, Image, ActivityIndicator, Alert,
} from 'react-native';
import { useState, useMemo, useRef, useCallback } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { marketplaceAPI } from '../../src/api/apiClient';

const W = Dimensions.get('window').width;
const CARD = (W - 48) / 2;
const DRAWER_HEIGHT = 520;

const CATEGORIES  = ['All', 'Top', 'Bottom', 'Dress', 'Shoes', 'Accessories', 'Outerwear', 'Other'];
const SIZES       = ['All', 'XS', 'S', 'M', 'L', 'XL'];
const COLORS      = ['All', 'Black', 'White', 'Red', 'Blue', 'Brown'];
const SORT_OPTIONS = ['Default', 'Price: Low to High', 'Price: High to Low', 'Name: A-Z'];

interface MarketplaceItem {
  listing_id?: number;
  item_id: number;
  title: string;
  category: string;
  size?: string;
  color?: string;
  price: number;
  image_url?: string;
}

// Which section the drawer opens to
type DrawerSection = 'all' | 'category' | 'size' | 'color' | 'sort';

export default function SearchScreen() {
  const router = useRouter();
  const [items, setItems] = useState<MarketplaceItem[]>([]);
  const [loading, setLoading] = useState(true);

  // ── Filter state
  const [query,    setQuery]    = useState('');
  const [category, setCategory] = useState('All');
  const [size,     setSize]     = useState('All');
  const [color,    setColor]    = useState('All');
  const [sort,     setSort]     = useState('Default');

  // ── Drawer state
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [drawerSection, setDrawerSection] = useState<DrawerSection>('all');
  const slideAnim = useRef(new Animated.Value(DRAWER_HEIGHT)).current;

  const categoryToEmoji: Record<string, string> = {
    Top: '👕',
    Bottom: '👖',
    Dress: '👗',
    Shoes: '👠',
    Accessories: '🧣',
    Outerwear: '🧥',
    Other: '👔',
  };

  const loadMarketplaceListings = async () => {
    try {
      setLoading(true);
      const listings = await marketplaceAPI.getAllListings();
      setItems(listings || []);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load marketplace items');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadMarketplaceListings();
    }, [])
  );

  // ── Open drawer — slide up
  const openDrawer = (section: DrawerSection) => {
    setDrawerSection(section);
    setDrawerVisible(true);
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      damping: 22,
      stiffness: 180,
    }).start();
  };

  // ── Close drawer — slide down
  const closeDrawer = () => {
    Animated.timing(slideAnim, {
      toValue: DRAWER_HEIGHT,
      duration: 240,
      useNativeDriver: true,
    }).start(() => setDrawerVisible(false));
  };

  // ── Reset everything
  const clearAll = () => {
    setCategory('All');
    setSize('All');
    setColor('All');
    setSort('Default');
  };

  // ── Active filter count
  const activeCount = [
    category !== 'All',
    size !== 'All',
    color !== 'All',
    sort !== 'Default',
  ].filter(Boolean).length;

  // ── Filtered + sorted results
  const results = useMemo(() => {
    let filtered = [...items];
    if (query.trim()) {
      const q = query.toLowerCase();
      filtered = filtered.filter(i => i.title?.toLowerCase().includes(q));
    }
    if (category !== 'All') filtered = filtered.filter(i => i.category === category);
    if (size     !== 'All') filtered = filtered.filter(i => i.size === size);
    if (color    !== 'All') filtered = filtered.filter(i => i.color === color);
    if (sort === 'Price: Low to High') filtered.sort((a, b) => Number(a.price) - Number(b.price));
    if (sort === 'Price: High to Low') filtered.sort((a, b) => Number(b.price) - Number(a.price));
    if (sort === 'Name: A-Z') filtered.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    return filtered;
  }, [items, query, category, size, color, sort]);

  // ── Pill label — shows selected value if active
  const pillLabel = (
    label: string,
    value: string,
    def: string,
  ) => (value !== def ? value : label);

  // ── Chip grid used in drawer
  const ChipGrid = ({
    options,
    selected,
    onSelect,
    square = false,
  }: {
    options: string[];
    selected: string;
    onSelect: (v: string) => void;
    square?: boolean;
  }) => (
    <View style={styles.chipGrid}>
      {options.map(opt => (
        <TouchableOpacity
          key={opt}
          style={[
            styles.chip,
            square && styles.chipSquare,
            selected === opt && styles.chipOn,
          ]}
          onPress={() => onSelect(opt)}
        >
          <Text style={[styles.chipTxt, selected === opt && styles.chipTxtOn]}>
            {opt}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  // ── Radio list used for Sort in drawer
  const RadioList = ({
    options,
    selected,
    onSelect,
  }: {
    options: string[];
    selected: string;
    onSelect: (v: string) => void;
  }) => (
    <View>
      {options.map((opt, i) => (
        <TouchableOpacity
          key={opt}
          style={[
            styles.radioRow,
            i < options.length - 1 && styles.radioRowBorder,
          ]}
          onPress={() => onSelect(opt)}
        >
          <Text style={styles.radioLabel}>{opt}</Text>
          <View style={[styles.radioCircle, selected === opt && styles.radioCircleOn]}>
            {selected === opt && <View style={styles.radioDot} />}
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );

  // ── Drawer body — renders either all sections or a specific one
  const DrawerBody = () => {
    const sections: { key: DrawerSection; label: string; node: React.ReactNode }[] = [
      {
        key: 'category',
        label: 'Category',
        node: <ChipGrid options={CATEGORIES} selected={category} onSelect={setCategory} />,
      },
      {
        key: 'size',
        label: 'Size',
        node: <ChipGrid options={SIZES} selected={size} onSelect={setSize} square />,
      },
      {
        key: 'color',
        label: 'Colour',
        node: <ChipGrid options={COLORS} selected={color} onSelect={setColor} />,
      },
      {
        key: 'sort',
        label: 'Sort by',
        node: <RadioList options={SORT_OPTIONS} selected={sort} onSelect={setSort} />,
      },
    ];

    const visible =
      drawerSection === 'all'
        ? sections
        : sections.filter(s => s.key === drawerSection);

    return (
      <>
        {visible.map(s => (
          <View key={s.key} style={styles.drawerSection}>
            <Text style={styles.drawerSectionLabel}>{s.label}</Text>
            {s.node}
          </View>
        ))}
      </>
    );
  };

  return (
    <View style={styles.container}>

      {/* ── Title ── */}
      <Text style={styles.title}>Search</Text>

      {/* ── Search bar ── */}
      <View style={styles.searchRow}>
        <Ionicons name="search" size={18} color={Colors.accent} style={styles.searchIcon} />
        <TextInput
          style={styles.searchBar}
          placeholder="Search clothing..."
          placeholderTextColor={Colors.accent}
          value={query}
          onChangeText={setQuery}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')}>
            <Ionicons name="close-circle" size={20} color={Colors.accent} />
          </TouchableOpacity>
        )}
      </View>

      {/* ── Filter pill row ── */}
      <View style={styles.pillRowWrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.pillRow}
      >
        {/* All filters pill */}
        <TouchableOpacity
          style={[styles.pill, activeCount > 0 && styles.pillActive]}
          onPress={() => openDrawer('all')}
        >
          <Ionicons
            name="options-outline"
            size={14}
            color={activeCount > 0 ? Colors.white : Colors.deep}
          />
          <Text style={[styles.pillTxt, activeCount > 0 && styles.pillTxtActive]}>
            Filters{activeCount > 0 ? ` (${activeCount})` : ''}
          </Text>
        </TouchableOpacity>

        {/* Category */}
        <TouchableOpacity
          style={[styles.pill, category !== 'All' && styles.pillActive]}
          onPress={() => openDrawer('category')}
        >
          <Text style={[styles.pillTxt, category !== 'All' && styles.pillTxtActive]}>
            {pillLabel('Category', category, 'All')}
          </Text>
          {category !== 'All' ? (
            <Ionicons name="close" size={13} color={Colors.white} />
          ) : (
            <Ionicons name="chevron-down" size={13} color={Colors.deep} />
          )}
        </TouchableOpacity>

        {/* Size */}
        <TouchableOpacity
          style={[styles.pill, size !== 'All' && styles.pillActive]}
          onPress={() => openDrawer('size')}
        >
          <Text style={[styles.pillTxt, size !== 'All' && styles.pillTxtActive]}>
            {pillLabel('Size', size, 'All')}
          </Text>
          {size !== 'All' ? (
            <Ionicons name="close" size={13} color={Colors.white} />
          ) : (
            <Ionicons name="chevron-down" size={13} color={Colors.deep} />
          )}
        </TouchableOpacity>

        {/* Colour */}
        <TouchableOpacity
          style={[styles.pill, color !== 'All' && styles.pillActive]}
          onPress={() => openDrawer('color')}
        >
          <Text style={[styles.pillTxt, color !== 'All' && styles.pillTxtActive]}>
            {pillLabel('Colour', color, 'All')}
          </Text>
          {color !== 'All' ? (
            <Ionicons name="close" size={13} color={Colors.white} />
          ) : (
            <Ionicons name="chevron-down" size={13} color={Colors.deep} />
          )}
        </TouchableOpacity>

        {/* Sort */}
        <TouchableOpacity
          style={[styles.pill, sort !== 'Default' && styles.pillActive]}
          onPress={() => openDrawer('sort')}
        >
          <Ionicons
            name="swap-vertical"
            size={13}
            color={sort !== 'Default' ? Colors.white : Colors.deep}
          />
          <Text style={[styles.pillTxt, sort !== 'Default' && styles.pillTxtActive]}>
            Sort
          </Text>
        </TouchableOpacity>
      </ScrollView>
      </View>

      {/* ── Results header ── */}
      <View style={styles.resultsHeader}>
        <Text style={styles.resultsCount}>
          {results.length} {results.length === 1 ? 'item' : 'items'} found
        </Text>
        {activeCount > 0 && (
          <TouchableOpacity onPress={clearAll} style={styles.clearBtn}>
            <Text style={styles.clearTxt}>Clear all</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ── Results grid ── */}
      {loading ? (
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color={Colors.accent} />
        </View>
      ) : results.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>🔍</Text>
          <Text style={styles.emptyText}>No items match your filters</Text>
          <TouchableOpacity style={styles.clearBtn2} onPress={clearAll}>
            <Text style={styles.clearTxt2}>Clear filters</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={results}
          numColumns={2}
          keyExtractor={item => String(item.listing_id || item.item_id)}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={styles.row}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => router.push(`/item/${item.listing_id || item.item_id}`)}
              activeOpacity={0.85}
            >
              <View style={styles.imgBox}>
                {item.image_url ? (
                  <Image source={{ uri: item.image_url }} style={styles.image} resizeMode="cover" />
                ) : (
                  <Text style={styles.emoji}>{categoryToEmoji[item.category] || '👔'}</Text>
                )}
              </View>
              <Text style={styles.itemName} numberOfLines={1}>{item.title}</Text>
              <View style={styles.cardBottom}>
                <Text style={styles.price}>Rs {item.price}</Text>
                <View style={styles.sizeBadge}>
                  <Text style={styles.sizeBadgeTxt}>{item.size || '-'}</Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      {/* ── Bottom-sheet drawer ── */}
      <Modal
        visible={drawerVisible}
        transparent
        animationType="none"
        statusBarTranslucent
        onRequestClose={closeDrawer}
      >
        {/* Dim overlay */}
        <Pressable style={styles.overlay} onPress={closeDrawer} />

        {/* Animated drawer */}
        <Animated.View
          style={[
            styles.drawer,
            { transform: [{ translateY: slideAnim }] },
          ]}
        >
          {/* Handle bar */}
          <View style={styles.handle} />

          {/* Drawer header */}
          <View style={styles.drawerHeader}>
            <Text style={styles.drawerTitle}>
              {drawerSection === 'all'      ? 'Filters'
               : drawerSection === 'category' ? 'Category'
               : drawerSection === 'size'     ? 'Size'
               : drawerSection === 'color'    ? 'Colour'
               : 'Sort by'}
            </Text>
            <TouchableOpacity onPress={clearAll}>
              <Text style={styles.drawerReset}>Reset</Text>
            </TouchableOpacity>
          </View>

          {/* Drawer sections */}
          <ScrollView
            contentContainerStyle={styles.drawerBody}
            showsVerticalScrollIndicator={false}
          >
            <DrawerBody />
          </ScrollView>

          {/* Apply button */}
          <TouchableOpacity style={styles.applyBtn} onPress={closeDrawer}>
            <Text style={styles.applyTxt}>
              Show {results.length} {results.length === 1 ? 'item' : 'items'}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
    paddingTop: 56,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 30, fontWeight: '900', color: Colors.deep,
    fontStyle: 'italic', marginBottom: 14,
  },

  // Search bar
  searchRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.white, borderRadius: 12,
    borderWidth: 1.5, borderColor: Colors.card,
    paddingHorizontal: 12, marginBottom: 12,
  },
  searchIcon: { marginRight: 8 },
  searchBar: {
    flex: 1, paddingVertical: 13,
    fontSize: 15, color: Colors.deep,
  },

  // Pill row
  pillRowWrapper: {
    height: 44,
    marginBottom: 12,
  },
  pillRow: {
    flexDirection: 'row', gap: 8,
    paddingRight: 4,
    alignItems: 'center',
  },
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: Colors.white, borderRadius: 20,
    paddingHorizontal: 13, paddingVertical: 8,
    borderWidth: 1.5, borderColor: Colors.card,
  },
  pillActive: {
    backgroundColor: Colors.deep,
    borderColor: Colors.deep,
  },
  pillTxt: {
    fontSize: 13, fontWeight: '700', color: Colors.deep,
  },
  pillTxtActive: { color: Colors.white },

  // Results header
  resultsHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 10,
  },
  resultsCount: {
    fontSize: 14, fontWeight: '700', color: Colors.deep,
  },
  clearBtn: {
    backgroundColor: Colors.card, borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  clearTxt: { fontSize: 13, fontWeight: '800', color: Colors.deep },

  // Grid
  grid: { paddingBottom: 30 },
  row: { justifyContent: 'space-between', marginBottom: 14 },
  card: {
    width: CARD, backgroundColor: Colors.card,
    borderRadius: 20, overflow: 'hidden', padding: 10,
  },
  imgBox: {
    width: '100%', height: CARD - 20,
    backgroundColor: Colors.bg, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center',
    overflow: 'hidden',
  },
  image: { width: '100%', height: '100%' },
  emoji: { fontSize: 58 },
  itemName: {
    marginTop: 8, fontSize: 13, fontWeight: '700', color: Colors.deep,
  },
  cardBottom: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginTop: 4,
  },
  price: { fontSize: 12, color: Colors.accent, fontWeight: '700' },
  sizeBadge: {
    backgroundColor: Colors.accent, borderRadius: 6,
    paddingHorizontal: 7, paddingVertical: 2,
  },
  sizeBadgeTxt: { color: Colors.white, fontSize: 11, fontWeight: '800' },

  // Empty state
  emptyState: {
    flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12,
  },
  loaderWrap: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
  },
  emptyEmoji: { fontSize: 60 },
  emptyText: {
    fontSize: 16, fontWeight: '700', color: Colors.accent,
  },
  clearBtn2: {
    backgroundColor: Colors.accent, borderRadius: 12,
    paddingHorizontal: 20, paddingVertical: 10, marginTop: 4,
  },
  clearTxt2: { color: Colors.white, fontWeight: '800', fontSize: 15 },

  // ── Drawer ──────────────────────────────────────────────
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  drawer: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    height: DRAWER_HEIGHT,
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: Platform.OS === 'ios' ? 28 : 16,
  },
  handle: {
    width: 36, height: 4,
    backgroundColor: Colors.card,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
  },
  drawerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 4,
  },
  drawerTitle: {
    fontSize: 18, fontWeight: '800', color: Colors.deep,
  },
  drawerReset: {
    fontSize: 13, color: Colors.accent, fontWeight: '700',
  },
  drawerBody: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  drawerSection: {
    marginBottom: 24,
  },
  drawerSectionLabel: {
    fontSize: 11, fontWeight: '800',
    color: Colors.accent,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 12,
  },

  // Chips inside drawer
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16, paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1.5, borderColor: Colors.card,
    backgroundColor: Colors.white,
  },
  chipSquare: {
    borderRadius: 10,
    minWidth: 52,
    alignItems: 'center',
  },
  chipOn: {
    backgroundColor: Colors.deep,
    borderColor: Colors.deep,
  },
  chipTxt: { fontSize: 13, fontWeight: '700', color: Colors.deep },
  chipTxtOn: { color: Colors.white },

  // Radio list (sort)
  radioRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
  },
  radioRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.card,
  },
  radioLabel: {
    fontSize: 15, fontWeight: '600', color: Colors.deep,
  },
  radioCircle: {
    width: 20, height: 20,
    borderRadius: 10,
    borderWidth: 2, borderColor: Colors.card,
    justifyContent: 'center', alignItems: 'center',
  },
  radioCircleOn: {
    borderColor: Colors.deep,
    backgroundColor: Colors.deep,
  },
  radioDot: {
    width: 8, height: 8,
    borderRadius: 4,
    backgroundColor: Colors.white,
  },

  // Apply button
  applyBtn: {
    marginHorizontal: 20,
    marginTop: 4,
    backgroundColor: Colors.deep,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
  },
  applyTxt: {
    color: Colors.white, fontSize: 15, fontWeight: '800',
  },
});