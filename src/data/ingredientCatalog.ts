// Ingredient catalog for the manual add / scan flow.
// `en` is the canonical name sent to the backend (recipe matching and AI both
// work on English ingredient names); az/ru/tr are display-only translations.

export type CatalogCategoryId =
  | 'veg' | 'fruit' | 'herb' | 'meat' | 'fish' | 'dairy'
  | 'grain' | 'legume' | 'nut' | 'oil' | 'bake' | 'can' | 'drink' | 'other';

export interface CatalogCategory {
  id: CatalogCategoryId;
  en: string; az: string; ru: string; tr: string;
}

export interface CatalogIngredient {
  en: string; az: string; ru: string; tr: string;
  cat: CatalogCategoryId;
}

export const CATALOG_CATEGORIES: CatalogCategory[] = [
  { id: 'veg',    en: 'Vegetables',       az: 'Tərəvəzlər',            ru: 'Овощи',                 tr: 'Sebzeler' },
  { id: 'fruit',  en: 'Fruits',           az: 'Meyvələr',              ru: 'Фрукты',                tr: 'Meyveler' },
  { id: 'herb',   en: 'Herbs & Spices',   az: 'Göyərti və ədviyyat',   ru: 'Зелень и специи',       tr: 'Otlar ve baharat' },
  { id: 'meat',   en: 'Meat & Poultry',   az: 'Ət və quş əti',         ru: 'Мясо и птица',          tr: 'Et ve tavuk' },
  { id: 'fish',   en: 'Fish & Seafood',   az: 'Balıq və dəniz məhsulları', ru: 'Рыба и морепродукты', tr: 'Balık ve deniz ürünleri' },
  { id: 'dairy',  en: 'Dairy & Eggs',     az: 'Süd məhsulları və yumurta', ru: 'Молочное и яйца',   tr: 'Süt ürünleri ve yumurta' },
  { id: 'grain',  en: 'Grains & Pasta',   az: 'Dənli və makaron',      ru: 'Крупы и макароны',      tr: 'Tahıl ve makarna' },
  { id: 'legume', en: 'Legumes',          az: 'Paxlalılar',            ru: 'Бобовые',               tr: 'Baklagiller' },
  { id: 'nut',    en: 'Nuts & Dried',     az: 'Qoz-fındıq və qurular', ru: 'Орехи и сухофрукты',    tr: 'Kuruyemiş ve kurular' },
  { id: 'oil',    en: 'Oils & Sauces',    az: 'Yağlar və souslar',     ru: 'Масла и соусы',         tr: 'Yağlar ve soslar' },
  { id: 'bake',   en: 'Baking & Sweets',  az: 'Şirniyyat və un',       ru: 'Выпечка и сладкое',     tr: 'Fırın ve tatlı' },
  { id: 'can',    en: 'Canned & Pickled', az: 'Konserv və turşular',   ru: 'Консервы и соленья',    tr: 'Konserve ve turşu' },
  { id: 'drink',  en: 'Drinks',           az: 'İçkilər',               ru: 'Напитки',               tr: 'İçecekler' },
  { id: 'other',  en: 'Other',            az: 'Digər',                 ru: 'Прочее',                tr: 'Diğer' },
];

const i = (en: string, az: string, ru: string, tr: string, cat: CatalogCategoryId): CatalogIngredient =>
  ({ en, az, ru, tr, cat });

export const INGREDIENT_CATALOG: CatalogIngredient[] = [
  // ── Vegetables ──
  i('tomato', 'pomidor', 'помидор', 'domates', 'veg'),
  i('cucumber', 'xiyar', 'огурец', 'salatalık', 'veg'),
  i('onion', 'soğan', 'лук', 'soğan', 'veg'),
  i('red onion', 'qırmızı soğan', 'красный лук', 'kırmızı soğan', 'veg'),
  i('garlic', 'sarımsaq', 'чеснок', 'sarımsak', 'veg'),
  i('potato', 'kartof', 'картофель', 'patates', 'veg'),
  i('sweet potato', 'şirin kartof', 'батат', 'tatlı patates', 'veg'),
  i('carrot', 'yerkökü', 'морковь', 'havuç', 'veg'),
  i('eggplant', 'badımcan', 'баклажан', 'patlıcan', 'veg'),
  i('zucchini', 'kabaçok', 'кабачок', 'kabak', 'veg'),
  i('pumpkin', 'balqabaq', 'тыква', 'bal kabağı', 'veg'),
  i('bell pepper', 'bolqar bibəri', 'болгарский перец', 'dolmalık biber', 'veg'),
  i('chili pepper', 'acı bibər', 'острый перец', 'acı biber', 'veg'),
  i('cabbage', 'kələm', 'капуста', 'lahana', 'veg'),
  i('red cabbage', 'qırmızı kələm', 'красная капуста', 'kırmızı lahana', 'veg'),
  i('cauliflower', 'gül kələm', 'цветная капуста', 'karnabahar', 'veg'),
  i('broccoli', 'brokkoli', 'брокколи', 'brokoli', 'veg'),
  i('spinach', 'ispanaq', 'шпинат', 'ıspanak', 'veg'),
  i('lettuce', 'kahı', 'салат латук', 'marul', 'veg'),
  i('beetroot', 'çuğundur', 'свёкла', 'pancar', 'veg'),
  i('radish', 'turp', 'редис', 'turp', 'veg'),
  i('turnip', 'şalğam', 'репа', 'şalgam', 'veg'),
  i('green beans', 'yaşıl lobya', 'стручковая фасоль', 'taze fasulye', 'veg'),
  i('corn', 'qarğıdalı', 'кукуруза', 'mısır', 'veg'),
  i('mushroom', 'göbələk', 'грибы', 'mantar', 'veg'),
  i('celery', 'kərəviz', 'сельдерей', 'kereviz', 'veg'),
  i('leek', 'kəvər', 'лук-порей', 'pırasa', 'veg'),
  i('okra', 'bamya', 'бамия', 'bamya', 'veg'),
  i('asparagus', 'qulançar', 'спаржа', 'kuşkonmaz', 'veg'),
  i('ginger root', 'zəncəfil kökü', 'корень имбиря', 'taze zencefil', 'veg'),

  // ── Fruits ──
  i('apple', 'alma', 'яблоко', 'elma', 'fruit'),
  i('pear', 'armud', 'груша', 'armut', 'fruit'),
  i('banana', 'banan', 'банан', 'muz', 'fruit'),
  i('orange', 'portağal', 'апельсин', 'portakal', 'fruit'),
  i('mandarin', 'mandarin', 'мандарин', 'mandalina', 'fruit'),
  i('lemon', 'limon', 'лимон', 'limon', 'fruit'),
  i('lime', 'laym', 'лайм', 'misket limonu', 'fruit'),
  i('grapefruit', 'qreypfrut', 'грейпфрут', 'greyfurt', 'fruit'),
  i('grape', 'üzüm', 'виноград', 'üzüm', 'fruit'),
  i('watermelon', 'qarpız', 'арбуз', 'karpuz', 'fruit'),
  i('melon', 'yemiş', 'дыня', 'kavun', 'fruit'),
  i('peach', 'şaftalı', 'персик', 'şeftali', 'fruit'),
  i('apricot', 'ərik', 'абрикос', 'kayısı', 'fruit'),
  i('plum', 'gavalı', 'слива', 'erik', 'fruit'),
  i('cherry', 'gilas', 'черешня', 'kiraz', 'fruit'),
  i('sour cherry', 'albalı', 'вишня', 'vişne', 'fruit'),
  i('strawberry', 'çiyələk', 'клубника', 'çilek', 'fruit'),
  i('raspberry', 'moruq', 'малина', 'ahududu', 'fruit'),
  i('blackberry', 'böyürtkən', 'ежевика', 'böğürtlen', 'fruit'),
  i('blueberry', 'qaragilə', 'черника', 'yaban mersini', 'fruit'),
  i('pomegranate', 'nar', 'гранат', 'nar', 'fruit'),
  i('fig', 'əncir', 'инжир', 'incir', 'fruit'),
  i('persimmon', 'xurma', 'хурма', 'cennet hurması', 'fruit'),
  i('kiwi', 'kivi', 'киви', 'kivi', 'fruit'),
  i('pineapple', 'ananas', 'ананас', 'ananas', 'fruit'),
  i('mango', 'manqo', 'манго', 'mango', 'fruit'),
  i('avocado', 'avokado', 'авокадо', 'avokado', 'fruit'),
  i('quince', 'heyva', 'айва', 'ayva', 'fruit'),
  i('date', 'xurma (ərəb)', 'финики', 'hurma', 'fruit'),

  // ── Herbs & Spices ──
  i('dill', 'şüyüd', 'укроп', 'dereotu', 'herb'),
  i('parsley', 'cəfəri', 'петрушка', 'maydanoz', 'herb'),
  i('cilantro', 'keşniş', 'кинза', 'kişniş', 'herb'),
  i('basil', 'reyhan', 'базилик', 'fesleğen', 'herb'),
  i('mint', 'nanə', 'мята', 'nane', 'herb'),
  i('tarragon', 'tərxun', 'эстрагон', 'tarhun', 'herb'),
  i('thyme', 'kəklikotu', 'тимьян', 'kekik', 'herb'),
  i('rosemary', 'rozmarin', 'розмарин', 'biberiye', 'herb'),
  i('oregano', 'oreqano', 'орегано', 'oregano', 'herb'),
  i('bay leaf', 'dəfnə yarpağı', 'лавровый лист', 'defne yaprağı', 'herb'),
  i('green onion', 'göy soğan', 'зелёный лук', 'yeşil soğan', 'herb'),
  i('salt', 'duz', 'соль', 'tuz', 'herb'),
  i('black pepper', 'qara istiot', 'чёрный перец', 'karabiber', 'herb'),
  i('red pepper flakes', 'qırmızı istiot', 'красный перец', 'pul biber', 'herb'),
  i('paprika', 'paprika', 'паприка', 'toz biber', 'herb'),
  i('cumin', 'zirə', 'зира', 'kimyon', 'herb'),
  i('turmeric', 'zərdəçöl', 'куркума', 'zerdeçal', 'herb'),
  i('ground ginger', 'zəncəfil (toz)', 'молотый имбирь', 'toz zencefil', 'herb'),
  i('cinnamon', 'darçın', 'корица', 'tarçın', 'herb'),
  i('clove', 'mixək', 'гвоздика', 'karanfil', 'herb'),
  i('cardamom', 'hil', 'кардамон', 'kakule', 'herb'),
  i('nutmeg', 'muskat qozu', 'мускатный орех', 'muskat', 'herb'),
  i('saffron', 'zəfəran', 'шафран', 'safran', 'herb'),
  i('sumac', 'sumax', 'сумах', 'sumak', 'herb'),
  i('vanilla', 'vanil', 'ваниль', 'vanilya', 'herb'),
  i('curry powder', 'kori ədviyyatı', 'карри', 'köri', 'herb'),
  i('garlic powder', 'sarımsaq tozu', 'чесночный порошок', 'sarımsak tozu', 'herb'),

  // ── Meat & Poultry ──
  i('beef', 'mal əti', 'говядина', 'dana eti', 'meat'),
  i('lamb', 'quzu əti', 'баранина', 'kuzu eti', 'meat'),
  i('ground beef', 'qiymə', 'фарш', 'kıyma', 'meat'),
  i('chicken', 'toyuq', 'курица', 'tavuk', 'meat'),
  i('chicken breast', 'toyuq döşü', 'куриная грудка', 'tavuk göğsü', 'meat'),
  i('chicken thigh', 'toyuq budu', 'куриные бёдра', 'tavuk but', 'meat'),
  i('chicken wings', 'toyuq qanadı', 'куриные крылышки', 'tavuk kanat', 'meat'),
  i('turkey', 'hinduşka', 'индейка', 'hindi', 'meat'),
  i('duck', 'ördək', 'утка', 'ördek', 'meat'),
  i('liver', 'qaraciyər', 'печень', 'ciğer', 'meat'),
  i('sausage', 'sosiska', 'сосиски', 'sosis', 'meat'),
  i('salami', 'salyami', 'салями', 'salam', 'meat'),
  i('bacon', 'bekon', 'бекон', 'bacon', 'meat'),

  // ── Fish & Seafood ──
  i('salmon', 'qızılbalıq', 'лосось', 'somon', 'fish'),
  i('tuna', 'tuna', 'тунец', 'ton balığı', 'fish'),
  i('trout', 'farel', 'форель', 'alabalık', 'fish'),
  i('sea bass', 'sibas', 'сибас', 'levrek', 'fish'),
  i('sea bream', 'çipura', 'дорадо', 'çipura', 'fish'),
  i('cod', 'treska', 'треска', 'morina', 'fish'),
  i('sardine', 'sardina', 'сардины', 'sardalya', 'fish'),
  i('anchovy', 'hamsi', 'анчоусы', 'hamsi', 'fish'),
  i('mackerel', 'skumbriya', 'скумбрия', 'uskumru', 'fish'),
  i('shrimp', 'krevet', 'креветки', 'karides', 'fish'),
  i('mussels', 'midiya', 'мидии', 'midye', 'fish'),
  i('squid', 'kalmar', 'кальмар', 'kalamar', 'fish'),
  i('octopus', 'osminoq', 'осьминог', 'ahtapot', 'fish'),
  i('crab', 'krab', 'краб', 'yengeç', 'fish'),
  i('caviar', 'kürü', 'икра', 'havyar', 'fish'),

  // ── Dairy & Eggs ──
  i('milk', 'süd', 'молоко', 'süt', 'dairy'),
  i('yogurt', 'qatıq', 'йогурт', 'yoğurt', 'dairy'),
  i('ayran', 'ayran', 'айран', 'ayran', 'dairy'),
  i('kefir', 'kefir', 'кефир', 'kefir', 'dairy'),
  i('cream', 'qaymaq', 'сливки', 'krema', 'dairy'),
  i('sour cream', 'xama', 'сметана', 'ekşi krema', 'dairy'),
  i('butter', 'kərə yağı', 'сливочное масло', 'tereyağı', 'dairy'),
  i('cheese', 'pendir', 'сыр', 'peynir', 'dairy'),
  i('white cheese', 'ağ pendir', 'брынза', 'beyaz peynir', 'dairy'),
  i('mozzarella', 'mozzarella', 'моцарелла', 'mozzarella', 'dairy'),
  i('parmesan', 'parmezan', 'пармезан', 'parmesan', 'dairy'),
  i('cheddar', 'çedder', 'чеддер', 'kaşar', 'dairy'),
  i('feta', 'feta', 'фета', 'beyaz peynir (feta)', 'dairy'),
  i('cottage cheese', 'kəsmik', 'творог', 'lor peyniri', 'dairy'),
  i('cream cheese', 'krem pendir', 'сливочный сыр', 'krem peynir', 'dairy'),
  i('condensed milk', 'qatılaşdırılmış süd', 'сгущёнка', 'yoğunlaştırılmış süt', 'dairy'),
  i('egg', 'yumurta', 'яйцо', 'yumurta', 'dairy'),
  i('quail egg', 'bildirçin yumurtası', 'перепелиные яйца', 'bıldırcın yumurtası', 'dairy'),

  // ── Grains & Pasta ──
  i('rice', 'düyü', 'рис', 'pirinç', 'grain'),
  i('basmati rice', 'basmati düyü', 'рис басмати', 'basmati pirinç', 'grain'),
  i('bulgur', 'bulqur', 'булгур', 'bulgur', 'grain'),
  i('buckwheat', 'qarabaşaq', 'гречка', 'karabuğday', 'grain'),
  i('oats', 'yulaf', 'овсянка', 'yulaf', 'grain'),
  i('semolina', 'manna yarması', 'манка', 'irmik', 'grain'),
  i('cornmeal', 'qarğıdalı unu', 'кукурузная мука', 'mısır unu', 'grain'),
  i('quinoa', 'kinoa', 'киноа', 'kinoa', 'grain'),
  i('couscous', 'kuskus', 'кускус', 'kuskus', 'grain'),
  i('pasta', 'makaron', 'макароны', 'makarna', 'grain'),
  i('spaghetti', 'spaqetti', 'спагетти', 'spagetti', 'grain'),
  i('noodles', 'əriştə', 'лапша', 'erişte', 'grain'),
  i('flour', 'un', 'мука', 'un', 'grain'),
  i('bread', 'çörək', 'хлеб', 'ekmek', 'grain'),
  i('lavash', 'lavaş', 'лаваш', 'lavaş', 'grain'),

  // ── Legumes ──
  i('lentils', 'mərci', 'чечевица', 'mercimek', 'legume'),
  i('red lentils', 'qırmızı mərci', 'красная чечевица', 'kırmızı mercimek', 'legume'),
  i('chickpeas', 'noxud', 'нут', 'nohut', 'legume'),
  i('white beans', 'ağ lobya', 'белая фасоль', 'kuru fasulye', 'legume'),
  i('red beans', 'qırmızı lobya', 'красная фасоль', 'barbunya', 'legume'),
  i('green peas', 'göy noxud', 'зелёный горошек', 'bezelye', 'legume'),
  i('soybeans', 'soya', 'соя', 'soya', 'legume'),
  i('fava beans', 'paxla', 'бобы', 'bakla', 'legume'),

  // ── Nuts & Dried ──
  i('walnut', 'qoz', 'грецкий орех', 'ceviz', 'nut'),
  i('almond', 'badam', 'миндаль', 'badem', 'nut'),
  i('hazelnut', 'fındıq', 'фундук', 'fındık', 'nut'),
  i('pistachio', 'püstə', 'фисташки', 'antep fıstığı', 'nut'),
  i('cashew', 'keşyu', 'кешью', 'kaju', 'nut'),
  i('peanut', 'yerfındığı', 'арахис', 'yer fıstığı', 'nut'),
  i('pine nuts', 'şam fıstığı', 'кедровые орехи', 'çam fıstığı', 'nut'),
  i('sunflower seeds', 'günəbaxan tumu', 'семечки', 'ay çekirdeği', 'nut'),
  i('pumpkin seeds', 'balqabaq tumu', 'тыквенные семечки', 'kabak çekirdeği', 'nut'),
  i('sesame seeds', 'küncüt', 'кунжут', 'susam', 'nut'),
  i('chia seeds', 'çia toxumu', 'семена чиа', 'chia tohumu', 'nut'),
  i('flax seeds', 'kətan toxumu', 'семена льна', 'keten tohumu', 'nut'),
  i('chestnut', 'şabalıd', 'каштан', 'kestane', 'nut'),
  i('raisins', 'kişmiş', 'изюм', 'kuru üzüm', 'nut'),
  i('dried apricots', 'quru ərik', 'курага', 'kuru kayısı', 'nut'),

  // ── Oils & Sauces ──
  i('olive oil', 'zeytun yağı', 'оливковое масло', 'zeytinyağı', 'oil'),
  i('sunflower oil', 'günəbaxan yağı', 'подсолнечное масло', 'ayçiçek yağı', 'oil'),
  i('ghee', 'ərinmiş yağ', 'топлёное масло', 'sadeyağ', 'oil'),
  i('coconut oil', 'kokos yağı', 'кокосовое масло', 'hindistan cevizi yağı', 'oil'),
  i('vinegar', 'sirkə', 'уксус', 'sirke', 'oil'),
  i('apple cider vinegar', 'alma sirkəsi', 'яблочный уксус', 'elma sirkesi', 'oil'),
  i('balsamic vinegar', 'balzamik sirkə', 'бальзамический уксус', 'balzamik sirke', 'oil'),
  i('soy sauce', 'soya sousu', 'соевый соус', 'soya sosu', 'oil'),
  i('tomato paste', 'tomat pastası', 'томатная паста', 'salça', 'oil'),
  i('ketchup', 'ketçup', 'кетчуп', 'ketçap', 'oil'),
  i('mayonnaise', 'mayonez', 'майонез', 'mayonez', 'oil'),
  i('mustard', 'xardal', 'горчица', 'hardal', 'oil'),
  i('honey', 'bal', 'мёд', 'bal', 'oil'),
  i('pomegranate molasses', 'narşərab', 'наршараб', 'nar ekşisi', 'oil'),
  i('tahini', 'tahin', 'тахини', 'tahin', 'oil'),
  i('hot sauce', 'acı sous', 'острый соус', 'acı sos', 'oil'),

  // ── Baking & Sweets ──
  i('sugar', 'şəkər', 'сахар', 'şeker', 'bake'),
  i('brown sugar', 'qəhvəyi şəkər', 'коричневый сахар', 'esmer şeker', 'bake'),
  i('powdered sugar', 'şəkər tozu', 'сахарная пудра', 'pudra şekeri', 'bake'),
  i('baking powder', 'qabartma tozu', 'разрыхлитель', 'kabartma tozu', 'bake'),
  i('baking soda', 'çay sodası', 'сода', 'karbonat', 'bake'),
  i('yeast', 'maya', 'дрожжи', 'maya', 'bake'),
  i('cocoa powder', 'kakao', 'какао', 'kakao', 'bake'),
  i('dark chocolate', 'tünd şokolad', 'тёмный шоколад', 'bitter çikolata', 'bake'),
  i('milk chocolate', 'süd şokoladı', 'молочный шоколад', 'sütlü çikolata', 'bake'),
  i('starch', 'nişasta', 'крахмал', 'nişasta', 'bake'),
  i('gelatin', 'jelatin', 'желатин', 'jelatin', 'bake'),
  i('jam', 'mürəbbə', 'варенье', 'reçel', 'bake'),

  // ── Canned & Pickled ──
  i('canned corn', 'konserv qarğıdalı', 'консервированная кукуруза', 'konserve mısır', 'can'),
  i('canned peas', 'konserv noxud', 'консервированный горошек', 'konserve bezelye', 'can'),
  i('canned tuna', 'konserv tuna', 'консервированный тунец', 'ton balığı konservesi', 'can'),
  i('canned tomatoes', 'konserv pomidor', 'консервированные помидоры', 'konserve domates', 'can'),
  i('pickles', 'xiyar turşusu', 'солёные огурцы', 'salatalık turşusu', 'can'),
  i('sauerkraut', 'kələm turşusu', 'квашеная капуста', 'lahana turşusu', 'can'),
  i('olives', 'zeytun', 'оливки', 'yeşil zeytin', 'can'),
  i('black olives', 'qara zeytun', 'маслины', 'siyah zeytin', 'can'),

  // ── Drinks ──
  i('water', 'su', 'вода', 'su', 'drink'),
  i('sparkling water', 'qazlı su', 'газированная вода', 'soda', 'drink'),
  i('black tea', 'qara çay', 'чёрный чай', 'siyah çay', 'drink'),
  i('green tea', 'yaşıl çay', 'зелёный чай', 'yeşil çay', 'drink'),
  i('coffee', 'qəhvə', 'кофе', 'kahve', 'drink'),
  i('orange juice', 'portağal şirəsi', 'апельсиновый сок', 'portakal suyu', 'drink'),
  i('red wine', 'qırmızı şərab', 'красное вино', 'kırmızı şarap', 'drink'),
  i('white wine', 'ağ şərab', 'белое вино', 'beyaz şarap', 'drink'),

  // ── Other ──
  i('tofu', 'tofu', 'тофу', 'tofu', 'other'),
  i('coconut milk', 'kokos südü', 'кокосовое молоко', 'hindistan cevizi sütü', 'other'),
  i('chicken broth', 'toyuq bulyonu', 'куриный бульон', 'tavuk suyu', 'other'),
  i('beef broth', 'ət bulyonu', 'говяжий бульон', 'et suyu', 'other'),
  i('breadcrumbs', 'suxarı', 'панировочные сухари', 'galeta unu', 'other'),
  i('ice', 'buz', 'лёд', 'buz', 'other'),
];

type LangKey = 'en' | 'az' | 'ru' | 'tr';

const byEn = new Map(INGREDIENT_CATALOG.map((it) => [it.en, it]));

/** Localized display name for a canonical (English) ingredient name. */
export function localizeIngredient(en: string, lang: string): string {
  const entry = byEn.get(en);
  if (!entry) return en;
  return entry[(['en', 'az', 'ru', 'tr'].includes(lang) ? lang : 'en') as LangKey];
}

/** Case-insensitive search across all four languages. */
export function searchCatalog(query: string): CatalogIngredient[] {
  const q = query.trim().toLocaleLowerCase('az');
  if (!q) return [];
  return INGREDIENT_CATALOG.filter((it) =>
    it.en.toLowerCase().includes(q) ||
    it.az.toLocaleLowerCase('az').includes(q) ||
    it.ru.toLowerCase().includes(q) ||
    it.tr.toLocaleLowerCase('tr').includes(q),
  );
}
