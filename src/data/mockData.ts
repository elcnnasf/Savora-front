export interface Recipe {
  id: string;
  name: string;
  image: string;
  calories: number;
  protein: number;
  cookTime: number;
  servings: number;
  rating: number;
  tags: string[];
  category: string;
  progress?: number;
  ingredients: { name: string; amount: string }[];
  steps: { step: number; instruction: string; duration?: number }[];
}

export const RECIPES: Recipe[] = [
  {
    id: '1',
    name: 'High Protein Chicken Bowl',
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&q=80',
    calories: 520,
    protein: 42,
    cookTime: 20,
    servings: 2,
    rating: 4.8,
    tags: ['High Protein', 'Quick'],
    category: 'Lunch',
    progress: 60,
    ingredients: [
      { name: 'Chicken breast', amount: '300g' },
      { name: 'Brown rice', amount: '200g' },
      { name: 'Cherry tomatoes', amount: '150g' },
      { name: 'Avocado', amount: '1 piece' },
      { name: 'Spinach', amount: '100g' },
      { name: 'Lemon', amount: '1 piece' },
      { name: 'Olive oil', amount: '2 tbsp' },
    ],
    steps: [
      { step: 1, instruction: 'Cook brown rice according to package instructions.', duration: 20 },
      { step: 2, instruction: 'Season chicken breast with salt, pepper, and lemon juice. Let marinate for 5 minutes.', duration: 5 },
      { step: 3, instruction: 'Heat olive oil in a skillet over medium-high heat. Cook chicken for 6–7 minutes per side until golden brown and cooked through.', duration: 14 },
      { step: 4, instruction: 'Rest the chicken for 3 minutes, then slice diagonally.', duration: 3 },
      { step: 5, instruction: 'Assemble bowls with rice, sliced chicken, halved tomatoes, sliced avocado, and fresh spinach. Squeeze lemon over the top and serve.', duration: 2 },
    ],
  },
  {
    id: '2',
    name: 'Creamy Garlic Chicken Pasta',
    image: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=600&q=80',
    calories: 620,
    protein: 35,
    cookTime: 30,
    servings: 2,
    rating: 4.6,
    tags: ['Comfort'],
    category: 'Dinner',
    progress: 90,
    ingredients: [
      { name: 'Pasta', amount: '200g' },
      { name: 'Chicken breast', amount: '250g' },
      { name: 'Heavy cream', amount: '150ml' },
      { name: 'Garlic cloves', amount: '4 cloves' },
      { name: 'Parmesan', amount: '50g' },
      { name: 'Butter', amount: '2 tbsp' },
      { name: 'Fresh parsley', amount: '1 handful' },
    ],
    steps: [
      { step: 1, instruction: 'Bring a large pot of salted water to a boil. Cook pasta until al dente.', duration: 10 },
      { step: 2, instruction: 'Meanwhile, dice the chicken breast into bite-sized pieces.', duration: 3 },
      { step: 3, instruction: 'Melt butter in a large pan. Cook chicken until golden, about 5–6 minutes.', duration: 6 },
      { step: 4, instruction: 'Add minced garlic and sauté for 1 minute until fragrant.', duration: 1 },
      { step: 5, instruction: 'Pour in heavy cream and simmer for 3–4 minutes until slightly thickened.', duration: 4 },
      { step: 6, instruction: 'Toss in drained pasta. Add parmesan, stir to coat. Season to taste and garnish with parsley.', duration: 2 },
    ],
  },
  {
    id: '3',
    name: 'Avocado Salad',
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&q=80',
    calories: 380,
    protein: 12,
    cookTime: 10,
    servings: 2,
    rating: 4.4,
    tags: ['Healthy'],
    category: 'Lunch',
    progress: 80,
    ingredients: [
      { name: 'Avocado', amount: '2 pieces' },
      { name: 'Cherry tomatoes', amount: '200g' },
      { name: 'Red onion', amount: '½ piece' },
      { name: 'Lime juice', amount: '2 tbsp' },
      { name: 'Cilantro', amount: '1 handful' },
      { name: 'Olive oil', amount: '1 tbsp' },
    ],
    steps: [
      { step: 1, instruction: 'Halve and dice the avocados. Halve the cherry tomatoes.', duration: 3 },
      { step: 2, instruction: 'Finely slice the red onion.', duration: 2 },
      { step: 3, instruction: 'Combine avocado, tomatoes, and onion in a bowl.', duration: 1 },
      { step: 4, instruction: 'Drizzle with lime juice and olive oil. Season with salt and pepper.', duration: 1 },
      { step: 5, instruction: 'Toss gently and garnish with fresh cilantro. Serve immediately.', duration: 1 },
    ],
  },
  {
    id: '4',
    name: 'Banana Protein Pancakes',
    image: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=600&q=80',
    calories: 340,
    protein: 24,
    cookTime: 15,
    servings: 2,
    rating: 4.7,
    tags: ['High Protein'],
    category: 'Breakfast',
    ingredients: [
      { name: 'Ripe banana', amount: '2 pieces' },
      { name: 'Eggs', amount: '3 whole' },
      { name: 'Protein powder', amount: '1 scoop' },
      { name: 'Oat flour', amount: '50g' },
      { name: 'Baking powder', amount: '½ tsp' },
    ],
    steps: [
      { step: 1, instruction: 'Mash bananas well in a large bowl until smooth.', duration: 2 },
      { step: 2, instruction: 'Add eggs and whisk until fully combined with the banana.', duration: 2 },
      { step: 3, instruction: 'Fold in protein powder, oat flour, and baking powder. Mix until just combined.', duration: 2 },
      { step: 4, instruction: 'Heat a non-stick pan over medium heat. Cook pancakes 2–3 min per side until golden.', duration: 9 },
    ],
  },
  {
    id: '5',
    name: 'Quinoa Veggie Bowl',
    image: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600&q=80',
    calories: 420,
    protein: 18,
    cookTime: 25,
    servings: 2,
    rating: 4.5,
    tags: ['Healthy'],
    category: 'Lunch',
    ingredients: [
      { name: 'Quinoa', amount: '150g' },
      { name: 'Mixed vegetables', amount: '300g' },
      { name: 'Feta cheese', amount: '50g' },
      { name: 'Olive oil', amount: '2 tbsp' },
      { name: 'Lemon', amount: '1 piece' },
    ],
    steps: [
      { step: 1, instruction: 'Rinse quinoa. Cook in 300ml water for 15 minutes, then fluff with a fork.', duration: 15 },
      { step: 2, instruction: 'Toss vegetables in olive oil. Roast at 200°C for 20 minutes.', duration: 20 },
      { step: 3, instruction: 'Combine quinoa and roasted vegetables. Top with crumbled feta and lemon juice.', duration: 2 },
    ],
  },
  {
    id: '6',
    name: 'Spicy Tofu Stir Fry',
    image: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=600&q=80',
    calories: 380,
    protein: 22,
    cookTime: 20,
    servings: 2,
    rating: 4.3,
    tags: ['Vegan', 'Quick'],
    category: 'Dinner',
    ingredients: [
      { name: 'Firm tofu', amount: '300g' },
      { name: 'Mixed vegetables', amount: '250g' },
      { name: 'Soy sauce', amount: '3 tbsp' },
      { name: 'Chili paste', amount: '1 tbsp' },
      { name: 'Sesame oil', amount: '1 tbsp' },
      { name: 'Ginger', amount: '1 tsp' },
    ],
    steps: [
      { step: 1, instruction: 'Press tofu for 10 minutes. Cut into 2cm cubes.', duration: 10 },
      { step: 2, instruction: 'Fry tofu in sesame oil until golden on all sides, about 6–8 minutes.', duration: 8 },
      { step: 3, instruction: 'Add vegetables and stir fry over high heat for 4–5 minutes.', duration: 5 },
      { step: 4, instruction: 'Add soy sauce, chili paste, and ginger. Toss to coat. Serve with steamed rice.', duration: 2 },
    ],
  },
];

export const WEEKLY_PROGRESS = [82, 75, 91, 68, 88, 45, 0];

export const ACHIEVEMENTS = [
  { id: '1', title: 'First Cook', desc: 'Cooked your first recipe', unlocked: true },
  { id: '2', title: 'On Fire', desc: '7-day cooking streak', unlocked: true },
  { id: '3', title: 'Protein King', desc: 'Hit protein goal 10 days', unlocked: true },
  { id: '4', title: 'Salad Days', desc: 'Made 5 salad recipes', unlocked: true },
  { id: '5', title: 'Top Chef', desc: 'Cooked 25 recipes', unlocked: false },
  { id: '6', title: 'Green Thumb', desc: '10 vegan meals in a row', unlocked: false },
  { id: '7', title: 'Planner Pro', desc: 'Planned a full month', unlocked: false },
  { id: '8', title: 'Master Chef', desc: 'Cooked 100 recipes', unlocked: false },
  { id: '9', title: 'Diamond', desc: '30-day streak', unlocked: false },
];

export type ShoppingItem = { id: string; name: string; checked: boolean };
export type ShoppingList = Record<string, ShoppingItem[]>;

export const INITIAL_SHOPPING_LIST: ShoppingList = {
  Produce: [
    { id: 'p1', name: 'Avocado', checked: false },
    { id: 'p2', name: 'Cherry Tomatoes', checked: true },
    { id: 'p3', name: 'Spinach', checked: false },
    { id: 'p4', name: 'Lemon', checked: false },
  ],
  'Dairy & Eggs': [
    { id: 'd1', name: 'Greek Yogurt', checked: false },
    { id: 'd2', name: 'Eggs', checked: true },
  ],
  'Meat & Fish': [
    { id: 'm1', name: 'Chicken Breast', checked: false },
    { id: 'm2', name: 'Salmon Fillet', checked: false },
  ],
  Pantry: [
    { id: 'pa1', name: 'Brown Rice', checked: true },
    { id: 'pa2', name: 'Olive Oil', checked: false },
  ],
};

export const MEAL_PLAN = {
  Breakfast: { name: 'Oatmeal with Berries', calories: 310, recipeId: '4' },
  Lunch: { name: 'High Protein Chicken Bowl', calories: 520, recipeId: '1' },
  Dinner: { name: 'Spicy Tofu Stir Fry', calories: 380, recipeId: '6' },
  Snacks: { name: 'Apple + Almond Butter', calories: 220, recipeId: '' },
};

export const DISCOVER_CATEGORIES = ['For You', 'Breakfast', 'Lunch', 'Dinner', 'Snacks', 'Desserts', 'Drinks'];

export const POPULAR_SEARCHES = ['#high-protein', '#low-calorie', '#Korean food', '#quick meals', '#healthy breakfast', '#chicken recipes'];

export const FAQ_ITEMS = [
  { q: 'How does ingredient scanning work?', a: 'Point your camera at any ingredient or food label. Savora identifies it using AI and suggests matching recipes.' },
  { q: 'Can I use Savora offline?', a: 'Saved recipes and your shopping list are available offline. AI features require an internet connection.' },
  { q: 'How do I cancel my Premium subscription?', a: 'Go to Profile → Settings → Manage Subscription. You can cancel anytime and retain access until the period ends.' },
  { q: 'Why are my saved recipes gone?', a: 'Saved recipes sync to your account. Make sure you\'re signed in with the same account on all your devices.' },
  { q: 'How accurate is the nutritional data?', a: 'Nutritional data is sourced from verified food databases and estimated per serving. Exact values may vary.' },
  { q: 'Can I share recipes with friends?', a: 'Yes — tap the share icon on any recipe to send a link. Recipients can view it without a Savora account.' },
];
