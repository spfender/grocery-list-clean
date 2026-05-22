"use client";

import { supabase } from "../lib/supabase";
import "./print.css";
import { useEffect, useRef, useState } from "react";

type GroceryItem = {
  id: number;
  name: string;
  quantity: string;
  category: string;
  checked: boolean;
};

type ArchivedList = {
  id: number;
  date: string;
  items: GroceryItem[];
};

const categoryOrder = [
  "Produce",
  "Meat & Seafood",
  "Dairy & Eggs",
  "Bakery",
  "Pantry",
  "Frozen",
  "Beverages",
  "Snacks",
  "Condiments & Sauces",
  "Spices & Baking",
  "Deli",
  "Household",
  "Personal Care",
  "Baby & Pet",
  "Other",
];

const categoryMap: Record<string, string> = {
  banana: "Produce",
  bananas: "Produce",
  apple: "Produce",
  apples: "Produce",
  lettuce: "Produce",
  tomato: "Produce",
  tomatoes: "Produce",
  onion: "Produce",
  onions: "Produce",
  potato: "Produce",
  potatoes: "Produce",
  carrots: "Produce",
  spinach: "Produce",
  avocado: "Produce",

  chicken: "Meat & Seafood",
  "chicken breast": "Meat & Seafood",
  beef: "Meat & Seafood",
  steak: "Meat & Seafood",
  pork: "Meat & Seafood",
  salmon: "Meat & Seafood",
  shrimp: "Meat & Seafood",
  turkey: "Meat & Seafood",
  bacon: "Meat & Seafood",

  milk: "Dairy & Eggs",
  eggs: "Dairy & Eggs",
  cheese: "Dairy & Eggs",
  yogurt: "Dairy & Eggs",
  butter: "Dairy & Eggs",
  cream: "Dairy & Eggs",

  bread: "Bakery",
  bagels: "Bakery",
  rolls: "Bakery",
  tortillas: "Bakery",

  rice: "Pantry",
  pasta: "Pantry",
  cereal: "Pantry",
  oatmeal: "Pantry",
  flour: "Pantry",
  sugar: "Pantry",
  beans: "Pantry",
  tuna: "Pantry",
  soup: "Pantry",

  "frozen pizza": "Frozen",
  "ice cream": "Frozen",
  waffles: "Frozen",

  coffee: "Beverages",
  tea: "Beverages",
  juice: "Beverages",
  seltzer: "Beverages",
  water: "Beverages",
  soda: "Beverages",

  chips: "Snacks",
  crackers: "Snacks",
  pretzels: "Snacks",
  popcorn: "Snacks",
  cookies: "Snacks",

  ketchup: "Condiments & Sauces",
  mustard: "Condiments & Sauces",
  mayo: "Condiments & Sauces",
  salsa: "Condiments & Sauces",
  "soy sauce": "Condiments & Sauces",
  "hot sauce": "Condiments & Sauces",

  salt: "Spices & Baking",
  pepper: "Spices & Baking",
  cinnamon: "Spices & Baking",
  vanilla: "Spices & Baking",

  "paper towels": "Household",
  "toilet paper": "Household",
  detergent: "Household",
  "dish soap": "Household",
  sponges: "Household",
  "trash bags": "Household",

  toothpaste: "Personal Care",
  shampoo: "Personal Care",
  conditioner: "Personal Care",
  soap: "Personal Care",
  deodorant: "Personal Care",

  diapers: "Baby & Pet",
  wipes: "Baby & Pet",
  "dog food": "Baby & Pet",
  "cat food": "Baby & Pet",
};

function normalizeName(name: string) {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

function getCategory(itemName: string, learnedRules: Record<string, string>) {
  const normalized = normalizeName(itemName);

  return learnedRules[normalized] || categoryMap[normalized] || "Other";
}

function parseItemInput(input: string) {
  const cleaned = input.trim().replace(/\s+/g, " ");

  const startsWithQuantity = cleaned.match(
    /^(\d+\s?(?:x|pk|pack|lb|lbs|oz|ct)?)\s+(.+)$/i,
  );

  if (startsWithQuantity) {
    return {
      quantity: startsWithQuantity[1],
      name: startsWithQuantity[2],
    };
  }

  const endsWithQuantity = cleaned.match(/^(.+?)\s+(?:x\s?(\d+)|(\d+))$/i);

  if (endsWithQuantity) {
    return {
      quantity: endsWithQuantity[2] || endsWithQuantity[3],
      name: endsWithQuantity[1],
    };
  }

  return {
    quantity: "",
    name: cleaned,
  };
}

export default function Home() {
  const [items, setItems] = useState<GroceryItem[]>([]);
  const [archivedLists, setArchivedLists] = useState<ArchivedList[]>([]);
  const [newItem, setNewItem] = useState("");
  const [quantity, setQuantity] = useState("");
  const [category, setCategory] = useState("Auto");
  const [message, setMessage] = useState("");
  const [categoryRules, setCategoryRules] = useState<Record<string, string>>(
    {},
  );
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadData() {
      const { data: groceryData } = await supabase
        .from("grocery_items")
        .select("*")
        .order("created_at", { ascending: true });

      const { data: archiveData } = await supabase
        .from("archived_lists")
        .select("*")
        .order("created_at", { ascending: false });

      if (groceryData) {
        setItems(groceryData);
      }

      if (archiveData) {
        setArchivedLists(archiveData);
      }
      const { data: rulesData } = await supabase
        .from("category_rules")
        .select("*");

      if (rulesData) {
        const rulesObject: Record<string, string> = {};

        rulesData.forEach((rule) => {
          rulesObject[rule.item_name] = rule.category;
        });

        setCategoryRules(rulesObject);
      }

      inputRef.current?.focus();
    }

    loadData();
    const channel = supabase
      .channel("grocery-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "grocery_items",
        },
        async () => {
          const { data } = await supabase
            .from("grocery_items")
            .select("*")
            .order("created_at", { ascending: true });

          if (data) {
            setItems(data);
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function addItem() {
    if (!newItem.trim()) return;

    const parsed = parseItemInput(newItem);
    const finalName = parsed.name.trim();
    const finalQuantity = quantity.trim() || parsed.quantity;
    const finalCategory =
      category === "Auto" ? getCategory(finalName, categoryRules) : category;

    if (category !== "Auto") {
      await supabase.from("category_rules").upsert({
        item_name: normalizeName(finalName),
        category: finalCategory,
      });

      setCategoryRules({
        ...categoryRules,
        [normalizeName(finalName)]: finalCategory,
      });
    }
    const alreadyExists = items.some(
      (item) => normalizeName(item.name) === normalizeName(finalName),
    );

    if (alreadyExists) {
      setMessage(`"${finalName}" is already on the list.`);
      inputRef.current?.focus();
      return;
    }

    const item: GroceryItem = {
      id: Date.now(),
      name: finalName,
      quantity: finalQuantity,
      category: finalCategory,
      checked: false,
    };

    const { error } = await supabase.from("grocery_items").insert(item);

    if (!error) {
      setItems([...items, item]);
    }
    setNewItem("");
    setQuantity("");
    setCategory("Auto");
    setMessage("");
    inputRef.current?.focus();
  }

  async function addQuickItem(name: string) {
    const item: GroceryItem = {
      id: Date.now(),
      name,
      quantity: "",
      category: "Pantry",
      checked: false,
    };

    const { error } = await supabase.from("grocery_items").insert(item);

    if (!error) {
      setItems([...items, item]);
    }

    inputRef.current?.focus();
  }

  async function toggleItem(id: number) {
    const updatedItems = items.map((item) =>
      item.id === id ? { ...item, checked: !item.checked } : item,
    );

    setItems(updatedItems);

    const updatedItem = updatedItems.find((item) => item.id === id);

    await supabase
      .from("grocery_items")
      .update({ checked: updatedItem?.checked })
      .eq("id", id);
  }

  async function deleteItem(id: number) {
    await supabase.from("grocery_items").delete().eq("id", id);

    setItems(items.filter((item) => item.id !== id));
  }

  async function updateItemCategory(item: GroceryItem, newCategory: string) {
    await supabase
      .from("grocery_items")
      .update({ category: newCategory })
      .eq("id", item.id);

    await supabase.from("category_rules").upsert({
      item_name: normalizeName(item.name),
      category: newCategory,
    });

    setItems(
      items.map((currentItem) =>
        currentItem.id === item.id
          ? { ...currentItem, category: newCategory }
          : currentItem,
      ),
    );

    setCategoryRules({
      ...categoryRules,
      [normalizeName(item.name)]: newCategory,
    });
  }

  async function clearCompleted() {
    const completedIds = items
      .filter((item) => item.checked)
      .map((item) => item.id);

    if (completedIds.length === 0) return;

    await supabase.from("grocery_items").delete().in("id", completedIds);

    setItems(items.filter((item) => !item.checked));
  }

  async function archiveCurrentList() {
    if (items.length === 0) return;

    const archivedList: ArchivedList = {
      id: Date.now(),
      date: new Date().toLocaleString(),
      items,
    };

    const { error } = await supabase
      .from("archived_lists")
      .insert(archivedList);

    if (!error) {
      await supabase.from("grocery_items").delete().neq("id", 0);

      setArchivedLists([archivedList, ...archivedLists]);
      setItems([]);
      setMessage("Current list archived. New list started.");
    }

    inputRef.current?.focus();
  }
  const categories = categoryOrder.filter((category) =>
    items.some((item) => item.category === category),
  );

  return (
    <main className="min-h-screen bg-[#f7f7f5] p-2 text-gray-900">
      <div className="mx-auto max-w-lg">
        <header className="mb-6 print-hidden">
          <div className="mb-1">
            <h1 className="text-3xl text-center font-semibold tracking-tight">
              Grocery List
            </h1>
            <p className="mt-1 text-sm text-center text-gray-500">
              Add items, sort by category, archive lists, and print when needed.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => window.print()}
              className="flex-1 rounded-sm bg-white px-3 py-2 text-sm font-medium shadow"
            >
              Print
            </button>

            <button
              onClick={archiveCurrentList}
              className="flex-1 rounded-sm bg-white px-3 py-2 text-sm font-medium shadow"
            >
              New List
            </button>
          </div>
        </header>

        <section className="mb-2 rounded-sm bg-white p-2 shadow print-hidden">
          <div className="mb-1">
            <label className="mb-1 block text-sm font-medium">Item</label>
            <input
              ref={inputRef}
              className="w-full rounded-sm border border-gray-300 px-4 py-1.5"
              placeholder="Try: 2 milk, bananas x3, paper towels..."
              value={newItem}
              onChange={(event) => {
                setNewItem(event.target.value);
                setMessage("");
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") addItem();
              }}
            />
          </div>

          <div className="mb-2 grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium">Quantity</label>
              <input
                className="h-9 w-full rounded-sm border border-gray-300 px-4 py-1.5"
                placeholder="Optional"
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Category</label>
              <select
                className="h-9 w-full rounded-sm border border-gray-300 px-4 py-1.5"
                value={category}
                onChange={(event) => setCategory(event.target.value)}
              >
                <option>Auto</option>
                {categoryOrder.map((category) => (
                  <option key={category}>{category}</option>
                ))}
              </select>
            </div>
          </div>

          {message && (
            <p className="mb-1 rounded-sm bg-yellow-50 px-3 py-2 text-sm text-yellow-800">
              {message}
            </p>
          )}

          <button
            className="mb-2 w-full rounded-none bg-black px-4 py-1.5 font-semibold text-white"
            onClick={addItem}
          >
            Add Item
          </button>

          <div className="flex gap-2">
            <button
              className="flex-1 rounded-none text-sm h-8 bg-pink-200 px-4 py-1.5 font-semibold text-pink-900"
              onClick={() => addQuickItem("✨ snackie ✨")}
            >
              Snackie
            </button>

            <button
              className="flex-1 rounded-none text-sm h-8 bg-yellow-200 px-4 py-1.5 font-semibold text-yellow-900"
              onClick={() => addQuickItem("✨ chippie ✨")}
            >
              Chippie
            </button>
          </div>
        </section>

        <div className="mb-1 flex items-center justify-between text-sm print-hidden">
          <span className="text-gray-500">
            {items.filter((item) => !item.checked).length} active item(s)
          </span>

          <button
            onClick={clearCompleted}
            className="font-medium text-gray-600 underline"
          >
            Clear completed
          </button>
        </div>

        {items.length === 0 && (
          <div className="rounded-sm bg-white p-6 text-center text-gray-500 shadow">
            Your grocery list is empty.
          </div>
        )}

        <div className="space-y-0">
          {categories.map((category) => {
            const categoryItems = items
              .filter((item) => item.category === category)
              .sort((a, b) => Number(a.checked) - Number(b.checked));

            return (
              <section key={category} className="py-1">
                <h2 className="mb-1 mt-1 text-sm font-semibold uppercase tracking-wide text-black">
                  {category}
                </h2>

                <ul className="space-y-2">
                  {categoryItems.map((item) => (
                    <li
                      key={item.id}
                      className={`flex items-center justify-between gap-3 text-md border-b border-gray-200 py-1 ${
                        item.checked ? "checked-item" : ""
                      } ${item.checked ? "checked-item opacity-50" : ""}`}
                    >
                      <label className="flex min-w-0 flex-1 items-center gap-3">
                        <input
                          type="checkbox"
                          checked={item.checked}
                          onChange={() => toggleItem(item.id)}
                          className="h-3.5 w-3.5 appearance-none border border-gray-600 checked:bg-gray-900"
                        />

                        <span
                          className={
                            item.checked
                              ? "truncate text-gray-400 line-through"
                              : "truncate font-medium"
                          }
                        >
                          {item.name}
                          {item.quantity && (
                            <span className="ml-2 text-sm font-normal text-gray-500">
                              ({item.quantity})
                            </span>
                          )}
                        </span>

                        {item.category === "Other" && !item.checked && (
                          <select
                            className="ml-2 rounded-sm border border-gray-300 px-2 py-1 text-sm"
                            value={item.category}
                            onChange={(event) =>
                              updateItemCategory(item, event.target.value)
                            }
                          >
                            <option>Other</option>
                            {categoryOrder
                              .filter((category) => category !== "Other")
                              .map((category) => (
                                <option key={category}>{category}</option>
                              ))}
                          </select>
                        )}
                      </label>

                      <button
                        className="text-md font-bold text-gray-600"
                        onClick={() => deleteItem(item.id)}
                      >
                        x
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>

        {archivedLists.length > 0 && (
          <section className="mt-8 rounded-sm bg-white p-2 shadow print-hidden">
            <h2 className="mb-1 text-lg text-center font-medium">Archived Lists</h2>

            <div className="space-y-3">
              {archivedLists.map((list) => (
                <details
                  key={list.id}
                  className="rounded-sm border border-gray-200 p-3"
                >
                  <summary className="cursor-pointer font-medium">
                    {list.date} — {list.items.length} item(s)
                  </summary>

                  <ul className="mt-3 space-y-1 text-sm text-gray-700">
                    {list.items.map((item) => (
                      <li key={item.id}>
                        {item.checked ? "✓" : "☐"} {item.name}
                        {item.quantity && ` (${item.quantity})`} —{" "}
                        {item.category}
                      </li>
                    ))}
                  </ul>
                </details>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
