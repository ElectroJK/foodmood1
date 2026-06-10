// Seed the database with a curated recipe catalogue covering common household
// ingredients. Run: `npm run seed`.

import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../config/db.js';
import Recipe from '../models/Recipe.js';

const img = (n) =>
  `https://images.unsplash.com/photo-${n}?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080`;

const SEED_RECIPES = [
  {
    name: 'Creamy Chicken Pasta',
    image: img('1610533514079-58a2c1436725'),
    cookingTime: 30,
    servings: 4,
    ingredients: [
      { name: 'Chicken Breast', amount: '300g', normalizedName: 'chicken' },
      { name: 'Milk', amount: '200ml', normalizedName: 'milk' },
      { name: 'Pasta', amount: '400g', normalizedName: 'pasta' },
      { name: 'Garlic', amount: '3 cloves', normalizedName: 'garlic' },
    ],
    instructions: [
      'Cook pasta according to package instructions',
      'Season and cook chicken breast until golden',
      'Add milk and garlic, simmer for 5 minutes',
      'Combine with pasta and serve hot',
    ],
    tags: ['dinner', 'comfort'],
  },
  {
    name: 'Fresh Tomato Salad',
    image: img('1546069901-ba9599a7e63c'),
    cookingTime: 10,
    servings: 2,
    ingredients: [
      { name: 'Tomatoes', amount: '4 pcs', normalizedName: 'tomato' },
      { name: 'Carrots', amount: '200g', normalizedName: 'carrot' },
      { name: 'Olive Oil', amount: '2 tbsp', normalizedName: 'olive oil' },
      { name: 'Lemon', amount: '1 pc', normalizedName: 'lemon' },
    ],
    instructions: [
      'Dice tomatoes and grate carrots',
      'Mix with olive oil and lemon juice',
      'Season with salt and pepper',
      'Serve fresh',
    ],
    tags: ['salad', 'quick', 'vegan'],
  },
  {
    name: 'Yogurt Berry Parfait',
    image: img('1488477181946-6428a0291777'),
    cookingTime: 5,
    servings: 2,
    ingredients: [
      { name: 'Yogurt', amount: '2 cups', normalizedName: 'yogurt' },
      { name: 'Granola', amount: '100g', normalizedName: 'granola' },
      { name: 'Honey', amount: '2 tbsp', normalizedName: 'honey' },
      { name: 'Berries', amount: '100g', normalizedName: 'berry' },
    ],
    instructions: [
      'Layer yogurt in glasses',
      'Add granola and berries',
      'Drizzle with honey',
      'Serve immediately',
    ],
    tags: ['breakfast', 'quick'],
  },
  {
    name: 'Veggie Stir Fry',
    image: img('1512621776951-a57141f2eefd'),
    cookingTime: 15,
    servings: 3,
    ingredients: [
      { name: 'Carrots', amount: '300g', normalizedName: 'carrot' },
      { name: 'Broccoli', amount: '200g', normalizedName: 'broccoli' },
      { name: 'Bell Pepper', amount: '1 pc', normalizedName: 'pepper' },
      { name: 'Soy Sauce', amount: '3 tbsp', normalizedName: 'soy sauce' },
    ],
    instructions: [
      'Heat oil in a wok or large pan',
      'Stir-fry vegetables for 5–7 minutes',
      'Add soy sauce and toss to coat',
      'Serve over rice',
    ],
    tags: ['dinner', 'vegan', 'quick'],
  },
  {
    name: 'Scrambled Eggs with Cheese',
    image: img('1551218808-94e220e084d2'),
    cookingTime: 10,
    servings: 2,
    ingredients: [
      { name: 'Eggs', amount: '4 pcs', normalizedName: 'egg' },
      { name: 'Cheese', amount: '50g', normalizedName: 'cheese' },
      { name: 'Butter', amount: '1 tbsp', normalizedName: 'butter' },
      { name: 'Milk', amount: '2 tbsp', normalizedName: 'milk' },
    ],
    instructions: [
      'Whisk eggs with milk and a pinch of salt',
      'Melt butter in a non-stick pan over low heat',
      'Pour eggs in, stir gently as they set',
      'Add cheese at the end, serve immediately',
    ],
    tags: ['breakfast', 'quick'],
  },
  {
    name: 'Banana Yogurt Smoothie',
    image: img('1623065422902-30a2d299bbe4'),
    cookingTime: 5,
    servings: 2,
    ingredients: [
      { name: 'Banana', amount: '2 pcs', normalizedName: 'banana' },
      { name: 'Milk', amount: '200ml', normalizedName: 'milk' },
      { name: 'Yogurt', amount: '100g', normalizedName: 'yogurt' },
      { name: 'Honey', amount: '1 tbsp', normalizedName: 'honey' },
    ],
    instructions: [
      'Peel and slice bananas',
      'Add all ingredients to a blender',
      'Blend until smooth',
      'Serve chilled',
    ],
    tags: ['breakfast', 'quick', 'snack'],
  },
  {
    name: 'Vegetable Soup',
    image: img('1547592180-85f173990554'),
    cookingTime: 35,
    servings: 4,
    ingredients: [
      { name: 'Potatoes', amount: '3 pcs', normalizedName: 'potato' },
      { name: 'Carrots', amount: '2 pcs', normalizedName: 'carrot' },
      { name: 'Onion', amount: '1 pc', normalizedName: 'onion' },
      { name: 'Celery', amount: '2 stalks', normalizedName: 'celery' },
    ],
    instructions: [
      'Chop all vegetables into bite-sized pieces',
      'Sauté onion until translucent',
      'Add remaining vegetables and water to cover',
      'Simmer for 25 minutes, season to taste',
    ],
    tags: ['soup', 'dinner', 'vegan'],
  },
  {
    name: 'Pasta Bolognese',
    image: img('1551183053-bf91a1d81141'),
    cookingTime: 40,
    servings: 4,
    ingredients: [
      { name: 'Pasta', amount: '400g', normalizedName: 'pasta' },
      { name: 'Ground Beef', amount: '500g', normalizedName: 'beef' },
      { name: 'Tomatoes', amount: '4 pcs', normalizedName: 'tomato' },
      { name: 'Onion', amount: '1 pc', normalizedName: 'onion' },
      { name: 'Garlic', amount: '2 cloves', normalizedName: 'garlic' },
    ],
    instructions: [
      'Brown beef with onion and garlic',
      'Add chopped tomatoes, simmer 20 min',
      'Cook pasta separately',
      'Combine and serve with grated cheese',
    ],
    tags: ['dinner', 'comfort'],
  },
  {
    name: 'Greek Salad',
    image: img('1540420773420-3366772f4999'),
    cookingTime: 10,
    servings: 2,
    ingredients: [
      { name: 'Tomatoes', amount: '3 pcs', normalizedName: 'tomato' },
      { name: 'Cucumber', amount: '1 pc', normalizedName: 'cucumber' },
      { name: 'Cheese', amount: '100g feta', normalizedName: 'cheese' },
      { name: 'Olive Oil', amount: '3 tbsp', normalizedName: 'olive oil' },
    ],
    instructions: [
      'Chop tomatoes and cucumber',
      'Cube cheese',
      'Drizzle with olive oil and oregano',
      'Toss gently and serve',
    ],
    tags: ['salad', 'quick'],
  },
  {
    name: 'Chicken Soup',
    image: img('1547592180-85f173990554'),
    cookingTime: 50,
    servings: 4,
    ingredients: [
      { name: 'Chicken', amount: '500g', normalizedName: 'chicken' },
      { name: 'Carrots', amount: '2 pcs', normalizedName: 'carrot' },
      { name: 'Onion', amount: '1 pc', normalizedName: 'onion' },
      { name: 'Celery', amount: '2 stalks', normalizedName: 'celery' },
    ],
    instructions: [
      'Simmer chicken in water for 30 min, skim foam',
      'Add chopped vegetables, simmer 15 more min',
      'Remove chicken, shred, return to pot',
      'Season and serve hot',
    ],
    tags: ['soup', 'dinner', 'comfort'],
  },
  {
    name: 'French Toast',
    image: img('1484723091739-30a097e8f929'),
    cookingTime: 15,
    servings: 2,
    ingredients: [
      { name: 'Bread', amount: '4 slices', normalizedName: 'bread' },
      { name: 'Eggs', amount: '2 pcs', normalizedName: 'egg' },
      { name: 'Milk', amount: '100ml', normalizedName: 'milk' },
      { name: 'Butter', amount: '2 tbsp', normalizedName: 'butter' },
    ],
    instructions: [
      'Whisk eggs with milk and a pinch of sugar',
      'Soak bread slices in egg mixture',
      'Fry in butter on both sides until golden',
      'Serve with honey or fruit',
    ],
    tags: ['breakfast', 'quick'],
  },
  {
    name: 'Mashed Potatoes',
    image: img('1518977676601-b53f82aba655'),
    cookingTime: 25,
    servings: 4,
    ingredients: [
      { name: 'Potatoes', amount: '1 kg', normalizedName: 'potato' },
      { name: 'Milk', amount: '100ml', normalizedName: 'milk' },
      { name: 'Butter', amount: '50g', normalizedName: 'butter' },
    ],
    instructions: [
      'Peel and boil potatoes until tender',
      'Drain and mash',
      'Stir in warm milk and butter',
      'Season with salt and pepper',
    ],
    tags: ['side', 'comfort'],
  },
  {
    name: 'Caesar Salad',
    image: img('1551248429-40975aa4de74'),
    cookingTime: 15,
    servings: 2,
    ingredients: [
      { name: 'Lettuce', amount: '1 head', normalizedName: 'lettuce' },
      { name: 'Chicken Breast', amount: '200g', normalizedName: 'chicken' },
      { name: 'Cheese', amount: '50g parmesan', normalizedName: 'cheese' },
      { name: 'Bread', amount: '2 slices for croutons', normalizedName: 'bread' },
    ],
    instructions: [
      'Grill chicken and slice thinly',
      'Toast bread cubes for croutons',
      'Toss lettuce with dressing, top with chicken, cheese, and croutons',
    ],
    tags: ['salad', 'lunch'],
  },
  {
    name: 'Cucumber Salad',
    image: img('1540420773420-3366772f4999'),
    cookingTime: 5,
    servings: 2,
    ingredients: [
      { name: 'Cucumber', amount: '2 pcs', normalizedName: 'cucumber' },
      { name: 'Yogurt', amount: '100g', normalizedName: 'yogurt' },
      { name: 'Garlic', amount: '1 clove', normalizedName: 'garlic' },
      { name: 'Lemon', amount: '1/2', normalizedName: 'lemon' },
    ],
    instructions: [
      'Slice cucumber thinly',
      'Mix yogurt with crushed garlic and lemon juice',
      'Combine and chill before serving',
    ],
    tags: ['salad', 'quick', 'vegetarian'],
  },
  {
    name: 'Banana Pancakes',
    image: img('1567620905732-2d1ec7ab7445'),
    cookingTime: 20,
    servings: 3,
    ingredients: [
      { name: 'Banana', amount: '2 pcs', normalizedName: 'banana' },
      { name: 'Eggs', amount: '2 pcs', normalizedName: 'egg' },
      { name: 'Milk', amount: '150ml', normalizedName: 'milk' },
      { name: 'Flour', amount: '200g', normalizedName: 'flour' },
    ],
    instructions: [
      'Mash bananas, whisk with eggs and milk',
      'Fold in flour until smooth',
      'Cook small pancakes on a buttered pan',
      'Serve with honey or berries',
    ],
    tags: ['breakfast'],
  },
];

async function main() {
  await connectDB();
  console.log(`[seed] clearing existing recipes...`);
  await Recipe.deleteMany({});
  await Recipe.insertMany(SEED_RECIPES);
  console.log(`[seed] inserted ${SEED_RECIPES.length} recipes`);
  await disconnectDB();
}

main().catch((e) => {
  console.error(e);
  mongoose.disconnect();
  process.exit(1);
});
