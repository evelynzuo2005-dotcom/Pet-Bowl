// Loki's Daily Meal - Desktop Web Dashboard with Real Firebase Google Login
// Copy everything into p5.js Web Editor sketch.js and press Play.
// IMPORTANT: In index.html, add Firebase compat SDK scripts before sketch.js.
// Optional: upload a pet photo named loki.jpg to the p5.js project files.

let page = "login";
let buttons = [];
let inputs = [];
let activeInput = null;
let petPhoto = null;
let loadingStart = 0;
let isGenerating = false;
let toastTimer = 0;
let searchText = "";

let isLoggedIn = false;
let authReady = false;
let authError = "";
let currentUser = null;
let auth = null;
let googleProvider = null;

let firebaseConfig = {
  apiKey: "AIzaSyDMrUS6_13zCe4WbtuZBfl1XzsiiE2xW3Y",
  authDomain: "pet-bowl.firebaseapp.com",
  projectId: "pet-bowl",
  storageBucket: "pet-bowl.firebasestorage.app",
  messagingSenderId: "337544809265",
  appId: "1:337544809265:web:82112c54c3fb5f0dfc7e10",
  measurementId: "G-16F0EMMS0M"
};

let pet = {
  name: "Loki",
  type: "Dog",
  weight: "20 lbs",
  age: "1 year",
  goal: "Sensitive Stomach"
};

let currentMeal = {
  title1: "Chicken + Carrot",
  title2: "+ Sweet Potato",
  protein: "Chicken",
  proteinGram: "80g",
  vegetable: "Carrot",
  vegetableGram: "30g",
  carb: "Sweet Potato",
  carbGram: "50g",
  kibble: "120g",
  tip: "Loki might need something warm and easy to digest today."
};

let C = {
  bg: "#F8F1EA",
  card: "#FFFDFC",
  brown: "#8B6A55",
  dark: "#4A3A31",
  muted: "#8E8177",
  light: "#B4A79F",
  cream: "#F2E7DC",
  green: "#DDE8D5",
  orange: "#F3C8A6",
  soft: "#FBF6F0",
  pink: "#F6E6DF",
  line: "#E6D8CC",
  danger: "#A34A43"
};

function preload() {
  petPhoto = loadImage("loki.jpg", imageLoaded, imageFailed);
}

function imageLoaded() {
}

function imageFailed() {
  petPhoto = null;
}

function setup() {
  createCanvas(1200, 760);
  textFont("Arial");
  setupFirebaseAuth();
}

function setupFirebaseAuth() {
  if (typeof firebase === "undefined") {
    authError = "Firebase SDK is missing. Add the Firebase scripts to index.html.";
    authReady = true;
    return;
  }

  try {
    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }
    auth = firebase.auth();
    googleProvider = new firebase.auth.GoogleAuthProvider();
    auth.onAuthStateChanged(function (user) {
      currentUser = user;
      isLoggedIn = user !== null;
      authReady = true;
      if (isLoggedIn && page === "login") {
        page = "today";
      }
      if (!isLoggedIn) {
        page = "login";
      }
    });
  } catch (e) {
    authError = e.message;
    authReady = true;
  }
}

function signInWithGoogle() {
  authError = "";
  if (!auth || !googleProvider) {
    authError = "Firebase Auth is not ready yet.";
    return;
  }
  auth.signInWithPopup(googleProvider).catch(function (error) {
    authError = error.message;
  });
}

function signOutUser() {
  if (auth) {
    auth.signOut();
  }
}

function draw() {
  background(C.bg);
  buttons = [];
  inputs = [];

  drawBackgroundDecor();

  if (!isLoggedIn) {
    drawLoginPage();
    return;
  }

  drawSidebar();
  drawTopBar();

  if (page === "today") drawTodayDashboard();
  if (page === "plan") drawPlanPage();
  if (page === "recipes") drawRecipesPage();
  if (page === "profile") drawProfilePage();

  drawRightPanel();

  if (isGenerating) drawGenerateOverlay();

  if (toastTimer > 0) {
    toastTimer--;
    drawToast("New meal plan is ready");
  }
}

function drawLoginPage() {
  drawCard(110, 95, 980, 570, 42, C.card);

  fill(C.brown);
  textStyle(BOLD);
  textSize(44);
  textAlign(LEFT, TOP);
  text("Loki's Daily Meal", 170, 165);

  fill(C.muted);
  textStyle(NORMAL);
  textSize(18);
  text("A gentle meal planner for picky pets and busy owners.", 172, 222);

  drawMealBowlGraphic(365, 390, 150);

  roundRect(590, 150, 410, 430, 34, C.bg);
  titleText("Welcome back", 650, 215, 32, C.dark);
  normalText("Sign in to create a daily meal plan for Loki.", 650, 260, 15, C.muted);

  if (!authReady) {
    normalText("Loading Firebase Auth...", 650, 330, 15, C.muted);
  } else {
    drawGoogleButton(650, 330, 290, 56);
  }

  normalText("Real Firebase Google sign-in", 650, 415, 13, C.light);
  normalText("After login, your Google profile is shown in the dashboard.", 650, 438, 13, C.muted);

  if (authError.length > 0) {
    roundRect(650, 490, 290, 56, 18, "#F9E3DF");
    normalText("Error:", 670, 502, 12, C.danger);
    normalText(shortenText(authError, 42), 670, 522, 12, C.danger);
  } else {
    roundRect(650, 500, 290, 42, 18, C.green);
    normalText("Next: generate a bowl and test the flow.", 670, 514, 12, C.dark);
  }
}

function drawGoogleButton(x, y, w, h) {
  let hover = mouseX > x && mouseX < x + w && mouseY > y && mouseY < y + h;
  let lift = hover ? -3 : 0;
  roundRect(x, y + lift, w, h, 24, C.card);
  stroke(C.line);
  strokeWeight(1);
  noFill();
  rect(x, y + lift, w, h, 24);
  noStroke();

  fill("#4285F4");
  textStyle(BOLD);
  textSize(22);
  textAlign(CENTER, CENTER);
  text("G", x + 34, y + h / 2 + lift);

  fill(C.dark);
  textSize(15);
  textAlign(LEFT, CENTER);
  text("Continue with Google", x + 70, y + h / 2 + lift);

  invisibleButton(x, y, w, h, function () {
    signInWithGoogle();
  });
}

function drawBackgroundDecor() {
  noStroke();
  fill("rgba(255,255,255,0.36)");
  circle(1060, 105, 190);
  fill("rgba(221,232,213,0.34)");
  circle(1040, 680, 240);
  fill("rgba(246,230,223,0.48)");
  circle(345, 705, 190);
}

function drawTopBar() {
  fill(C.dark);
  textStyle(BOLD);
  textSize(30);
  textAlign(LEFT, TOP);
  text("Loki's Daily Meal", 250, 42);

  fill(C.muted);
  textStyle(NORMAL);
  textSize(15);
  text("A gentle pet nutrition planner for everyday feeding", 252, 82);

  drawSearchBar(760, 42, 245, 46);
  drawUserAvatar(1050, 64, 48);
  fill(C.dark);
  textStyle(BOLD);
  textSize(14);
  textAlign(LEFT, CENTER);
  text(getUserName(), 1085, 64);

  addButton(1085, 88, 70, 28, "Sign out", C.soft, C.brown, function () {
    signOutUser();
  });
}

function getUserName() {
  if (currentUser && currentUser.displayName) {
    return shortenText(currentUser.displayName, 15);
  }
  return "Evelyn";
}

function drawUserAvatar(cx, cy, size) {
  noStroke();
  fill("#E8D8CB");
  circle(cx, cy, size);
  if (currentUser && currentUser.photoURL) {
    fill(C.brown);
    textAlign(CENTER, CENTER);
    textStyle(BOLD);
    textSize(16);
    text("G", cx, cy);
  } else {
    fill(C.brown);
    textAlign(CENTER, CENTER);
    textStyle(BOLD);
    textSize(15);
    text("E", cx, cy + 1);
  }
}

function drawSearchBar(x, y, w, h) {
  roundRect(x, y, w, h, 22, C.card);
  fill(C.light);
  textStyle(NORMAL);
  textSize(14);
  textAlign(LEFT, CENTER);
  text("Search meal or recipe", x + 22, y + h / 2);
}

function drawSidebar() {
  drawCard(28, 28, 178, 704, 34, C.card);

  fill(C.brown);
  textStyle(BOLD);
  textSize(22);
  textAlign(LEFT, TOP);
  text("Loki", 62, 62);
  fill(C.muted);
  textSize(13);
  textStyle(NORMAL);
  text("daily meal", 62, 91);

  navItem("today", "Today", "T", 62, 152);
  navItem("plan", "Create Plan", "P", 62, 212);
  navItem("recipes", "Recipes", "R", 62, 272);
  navItem("profile", "Profile", "L", 62, 332);

  roundRect(52, 600, 132, 92, 24, C.soft);
  fill(C.brown);
  textStyle(BOLD);
  textSize(13);
  textAlign(LEFT, TOP);
  text("Proof of Concept", 70, 620);
  fill(C.muted);
  textStyle(NORMAL);
  textSize(11);
  text("Testing if users", 70, 645);
  text("understand the meal", 70, 660);
  text("plan flow.", 70, 675);
}

function navItem(target, label, icon, x, y) {
  let active = page === target;
  let hover = mouseX > x - 14 && mouseX < x + 124 && mouseY > y - 12 && mouseY < y + 40;
  let lift = hover ? -4 : 0;
  let bg = active ? C.brown : hover ? C.soft : "rgba(0,0,0,0)";
  roundRect(x - 14, y - 12 + lift, 124, 46, 18, bg);

  fill(active ? "#FFFFFF" : C.brown);
  textStyle(BOLD);
  textSize(15 + (hover ? 1 : 0));
  textAlign(CENTER, CENTER);
  text(icon, x + 8, y + 11 + lift);

  fill(active ? "#FFFFFF" : C.dark);
  textAlign(LEFT, CENTER);
  textSize(14 + (hover ? 1 : 0));
  text(label, x + 34, y + 11 + lift);

  invisibleButton(x - 14, y - 12, 124, 46, function () {
    page = target;
    isGenerating = false;
  });
}

function drawTodayDashboard() {
  let x = 250;
  let y = 130;

  fill(C.dark);
  textStyle(BOLD);
  textSize(28);
  textAlign(LEFT, TOP);
  text("Today", x, y);
  fill(C.muted);
  textStyle(NORMAL);
  textSize(15);
  text("Here is Loki's gentle meal plan for today.", x, y + 38);

  drawCard(x, 205, 525, 250, 34, C.card);
  labelText("TODAY'S MEAL BOWL", x + 34, 232);
  fill(C.brown);
  textStyle(BOLD);
  textSize(34);
  textAlign(LEFT, TOP);
  text(currentMeal.title1, x + 34, 266);
  text(currentMeal.title2, x + 34, 306);
  normalText("Kibble: " + currentMeal.kibble, x + 34, 361, 15, C.muted);

  roundRect(x + 34, 390, 445, 42, 18, "#FBF2EA");
  normalText(currentMeal.tip, x + 52, 403, 13, C.dark);

  drawMealBowlGraphic(x + 395, 286, 110);

  drawCard(x, 480, 250, 135, 30, C.card);
  labelText("WEIGHT", x + 28, 506);
  titleText(pet.weight, x + 28, 535, 32, C.dark);
  normalText("Last updated today", x + 28, 579, 13, C.muted);

  drawCard(x + 275, 480, 250, 135, 30, C.green);
  labelText("GOAL", x + 303, 506, C.brown);
  drawGoalText(x + 303, 535);

  drawCard(x, 640, 525, 78, 28, C.card);
  titleText("Next Care Reminder", x + 28, 660, 18, C.dark);
  normalText("Deworming - in 28 days", x + 28, 688, 14, C.muted);
  addButton(x + 350, 657, 140, 42, "New Plan", C.brown, "#FFFFFF", function () {
    page = "plan";
  });
}

function drawGoalText(x, y) {
  if (pet.goal === "Sensitive Stomach") {
    titleText("Sensitive", x, y, 28, C.dark);
    titleText("Stomach", x, y + 35, 28, C.dark);
  } else {
    titleText(pet.goal, x, y, 28, C.dark);
  }
}

function drawPlanPage() {
  let x = 250;
  let y = 130;

  titleText("Create Meal Plan", x, y, 28, C.dark);
  normalText("Tell us about your pet, then generate a daily bowl.", x, y + 40, 15, C.muted);

  drawCard(x, 200, 525, 145, 30, C.card);
  labelText("PET NAME", x + 30, 226);
  inputBox("name", pet.name, x + 30, 250, 210, 48);
  labelText("PET TYPE", x + 280, 226);
  addPill(x + 280, 250, 90, 42, "Dog", pet.type === "Dog", function () {
    pet.type = "Dog";
  });
  addPill(x + 382, 250, 90, 42, "Cat", pet.type === "Cat", function () {
    pet.type = "Cat";
  });

  drawCard(x, 370, 525, 145, 30, C.card);
  labelText("WEIGHT", x + 30, 396);
  inputBox("weight", pet.weight, x + 30, 420, 190, 48);
  labelText("AGE", x + 270, 396);
  inputBox("age", pet.age, x + 270, 420, 190, 48);

  drawCard(x, 540, 525, 155, 30, C.card);
  labelText("CHOOSE TODAY'S GOAL", x + 30, 566);
  goalButton(x + 30, 598, 116, 46, "Balanced");
  goalButton(x + 158, 598, 116, 46, "Weight Loss");
  goalButton(x + 286, 598, 150, 46, "Sensitive Stomach");
  goalButton(x + 448, 598, 52, 46, "Energy");

  addButton(x, 690, 525, 54, "Generate Meal Plan", C.brown, "#FFFFFF", function () {
    activeInput = null;
    loadingStart = millis();
    isGenerating = true;
  });
}

function drawGenerateOverlay() {
  let elapsed = millis() - loadingStart;

  noStroke();
  fill("rgba(74,58,49,0.28)");
  rect(0, 0, width, height);

  drawCard(395, 165, 410, 430, 36, C.card);
  drawMealBowlGraphic(600, 290, 118);

  titleText("Preparing Loki's bowl...", 475, 382, 24, C.dark);
  normalText("The app is choosing a meal based on Loki's profile.", 455, 420, 14, C.muted);

  loadingLine("Checking weight", 0, elapsed, 470, 600);
  loadingLine("Choosing ingredients", 700, elapsed, 498, 600);
  loadingLine("Balancing fresh food and kibble", 1400, elapsed, 526, 600);

  if (elapsed > 2600) {
    applyMealPlan();
    isGenerating = false;
    page = "today";
    toastTimer = 100;
  }
}

function loadingLine(str, startTime, elapsed, y, cx) {
  let active = elapsed > startTime;
  fill(active ? C.dark : C.light);
  textStyle(BOLD);
  textSize(14);
  textAlign(CENTER, TOP);
  text((active ? "OK " : "") + str, cx, y);
}

function applyMealPlan() {
  if (pet.goal === "Sensitive Stomach") {
    currentMeal = {
      title1: "Chicken + Pumpkin",
      title2: "+ White Rice",
      protein: "Chicken",
      proteinGram: "75g",
      vegetable: "Pumpkin",
      vegetableGram: "35g",
      carb: "White Rice",
      carbGram: "45g",
      kibble: "110g",
      tip: "A gentle bowl with simple ingredients for easier digestion."
    };
  } else if (pet.goal === "Weight Loss") {
    currentMeal = {
      title1: "Turkey + Green Beans",
      title2: "+ Sweet Potato",
      protein: "Turkey",
      proteinGram: "70g",
      vegetable: "Green Beans",
      vegetableGram: "40g",
      carb: "Sweet Potato",
      carbGram: "35g",
      kibble: "95g",
      tip: "A lighter bowl that still feels filling for Loki."
    };
  } else if (pet.goal === "More Energy") {
    currentMeal = {
      title1: "Chicken + Egg",
      title2: "+ Sweet Potato",
      protein: "Chicken and Egg",
      proteinGram: "90g",
      vegetable: "Carrot",
      vegetableGram: "25g",
      carb: "Sweet Potato",
      carbGram: "60g",
      kibble: "125g",
      tip: "A warmer, higher-energy bowl for a more active day."
    };
  } else {
    currentMeal = {
      title1: "Chicken + Carrot",
      title2: "+ Sweet Potato",
      protein: "Chicken",
      proteinGram: "80g",
      vegetable: "Carrot",
      vegetableGram: "30g",
      carb: "Sweet Potato",
      carbGram: "50g",
      kibble: "120g",
      tip: "A balanced daily bowl with fresh food and kibble."
    };
  }
}

function drawRecipesPage() {
  let x = 250;
  titleText("Recipe Search", x, 130, 28, C.dark);
  normalText("Find meal ideas by goal or special need.", x, 170, 15, C.muted);

  drawCard(x, 210, 525, 62, 28, C.card);
  labelText("SEARCH", x + 26, 228);
  inputBox("search", searchText, x + 105, 218, 390, 42);
  if (searchText.length === 0 && activeInput !== "search") {
    normalText("weight loss or stomach-friendly", x + 120, 231, 14, C.light);
  }

  addPill(x, 300, 145, 38, "Sensitive Stomach", true, function () {
    searchText = "Sensitive Stomach";
  });
  addPill(x + 158, 300, 110, 38, "Weight Loss", false, function () {
    searchText = "Weight Loss";
  });
  addPill(x + 282, 300, 110, 38, "More Energy", false, function () {
    searchText = "More Energy";
  });

  recipeCard(x, 365, 250, "Sensitive Stomach Bowl", "Chicken - Pumpkin - Rice - Kibble", "Good for gentle digestion.");
  recipeCard(x + 275, 365, 250, "Weight Control Bowl", "Turkey - Green Beans - Sweet Potato", "Light but still filling.");
  recipeCard(x, 505, 250, "Energy Bowl", "Chicken - Egg - Sweet Potato", "For a more active day.");
  recipeCard(x + 275, 505, 250, "Low Fat Bowl", "Turkey - Rice - Green Beans", "Simple and lighter.");
}

function drawProfilePage() {
  let x = 250;
  titleText("Loki's Profile", x, 130, 28, C.dark);
  normalText("A soft identity card for daily care.", x, 170, 15, C.muted);

  drawCard(x, 220, 525, 390, 34, C.card);
  drawPetAvatar(x + 100, 330, 130);
  labelText("NAME", x + 220, 275);
  titleText(pet.name, x + 220, 300, 48, C.brown);
  profileLine("PERSONALITY", "playful, picky eater", x + 220, 380);
  profileLine("AGE", pet.age, x + 220, 430);
  profileLine("WEIGHT", pet.weight, x + 220, 480);
  profileLine("GOAL", pet.goal, x + 220, 530);
}

function drawRightPanel() {
  drawCard(825, 130, 320, 588, 34, C.card);

  drawPetAvatar(985, 210, 110);
  titleText(pet.name, 945, 282, 32, C.brown);
  normalText("picky eater - gentle meal plan", 890, 324, 14, C.muted);

  drawMiniStat(865, 365, 120, 86, "Weight", pet.weight);
  drawMiniStat(1000, 365, 120, 86, "Age", pet.age);

  roundRect(865, 475, 240, 76, 24, C.soft);
  labelText("TODAY'S GOAL", 890, 492);
  titleText(pet.goal, 890, 518, 20, C.dark);

  roundRect(865, 575, 240, 88, 24, C.green);
  titleText("User Testing Focus", 890, 595, 18, C.dark);
  normalText("Can users understand the input", 890, 625, 13, C.muted);
  normalText("and meal result without help?", 890, 643, 13, C.muted);
}

function drawMiniStat(x, y, w, h, label, value) {
  roundRect(x, y, w, h, 24, C.soft);
  labelText(label.toUpperCase(), x + 20, y + 18);
  titleText(value, x + 20, y + 44, 19, C.dark);
}

function drawMealBowlGraphic(cx, cy, size) {
  noStroke();
  fill(C.cream);
  ellipse(cx, cy + size * 0.25, size * 1.35, size * 0.72);
  fill(C.orange);
  circle(cx - size * 0.22, cy, size * 0.34);
  fill(C.green);
  circle(cx + size * 0.16, cy - size * 0.03, size * 0.32);
  fill(C.brown);
  circle(cx + size * 0.03, cy + size * 0.1, size * 0.22);
  fill("#FFFFFF");
  ellipse(cx, cy + size * 0.22, size * 1.08, size * 0.35);
}

function recipeCard(x, y, w, title, ingredients, desc) {
  drawCard(x, y, w, 112, 28, C.card);
  titleText(title, x + 24, y + 22, 17, C.dark);
  titleText(ingredients, x + 24, y + 54, 13, C.brown);
  normalText(desc, x + 24, y + 82, 13, C.muted);
}

function profileLine(label, value, x, y) {
  labelText(label, x, y - 14);
  titleText(value, x, y, 17, C.dark);
}

function goalButton(x, y, w, h, label) {
  let actual = label === "Energy" ? "More Energy" : label;
  let active = pet.goal === actual;
  roundRect(x, y, w, h, 18, active ? C.brown : C.soft);
  fill(active ? "#FFFFFF" : C.dark);
  textStyle(BOLD);
  textSize(label.length > 12 ? 12 : 13);
  textAlign(CENTER, CENTER);
  text(label, x + w / 2, y + h / 2);
  invisibleButton(x, y, w, h, function () {
    pet.goal = actual;
  });
}

function addPill(x, y, w, h, label, active, callback) {
  let hover = mouseX > x && mouseX < x + w && mouseY > y && mouseY < y + h;
  let lift = hover ? -3 : 0;
  roundRect(x, y + lift, w, h, h / 2, active ? C.brown : C.card);
  fill(active ? "#FFFFFF" : C.brown);
  textStyle(BOLD);
  textSize(13);
  textAlign(CENTER, CENTER);
  text(label, x + w / 2, y + h / 2 + lift);
  invisibleButton(x, y, w, h, callback);
}

function addButton(x, y, w, h, label, bg, txt, callback) {
  let hover = mouseX > x && mouseX < x + w && mouseY > y && mouseY < y + h;
  let lift = hover ? -3 : 0;
  roundRect(x, y + lift, w, h, 22, bg);
  fill(txt);
  textStyle(BOLD);
  textSize(16);
  textAlign(CENTER, CENTER);
  text(label, x + w / 2, y + h / 2 + lift);
  invisibleButton(x, y, w, h, callback);
}

function inputBox(id, value, x, y, w, h) {
  roundRect(x, y, w, h, 16, C.soft);
  fill(id === activeInput ? C.dark : C.muted);
  textStyle(BOLD);
  textSize(14);
  textAlign(LEFT, CENTER);
  let display = value;
  if (id === activeInput && frameCount % 60 < 30) display = display + "|";
  text(display, x + 14, y + h / 2);
  inputs.push({ id: id, x: x, y: y, w: w, h: h });
}

function mousePressed() {
  activeInput = null;
  for (let i = 0; i < inputs.length; i++) {
    if (hit(mouseX, mouseY, inputs[i])) {
      activeInput = inputs[i].id;
      return;
    }
  }
  for (let i = buttons.length - 1; i >= 0; i--) {
    if (hit(mouseX, mouseY, buttons[i])) {
      buttons[i].callback();
      return;
    }
  }
}

function keyPressed() {
  if (activeInput === null) return;
  if (keyCode === BACKSPACE) {
    editInput("backspace");
    return;
  }
  if (keyCode === ENTER || keyCode === RETURN) {
    activeInput = null;
    return;
  }
  if (key.length === 1) editInput(key);
}

function editInput(v) {
  if (activeInput === "name") pet.name = editText(pet.name, v, 14);
  if (activeInput === "weight") pet.weight = editText(pet.weight, v, 10);
  if (activeInput === "age") pet.age = editText(pet.age, v, 10);
  if (activeInput === "search") searchText = editText(searchText, v, 25);
}

function editText(str, v, maxLen) {
  if (v === "backspace") return str.slice(0, -1);
  if (str.length >= maxLen) return str;
  return str + v;
}

function drawPetAvatar(cx, cy, size) {
  noStroke();
  fill("#E8D8CB");
  circle(cx, cy, size);
  if (petPhoto && petPhoto.width > 1) {
    push();
    drawingContext.save();
    drawingContext.beginPath();
    drawingContext.arc(cx, cy, size / 2 - 2, 0, TWO_PI);
    drawingContext.clip();
    imageMode(CENTER);
    image(petPhoto, cx, cy, size, size);
    drawingContext.restore();
    pop();
  } else {
    fill(C.brown);
    textAlign(CENTER, CENTER);
    textStyle(BOLD);
    textSize(size > 80 ? 24 : 15);
    text("LOKI", cx, cy + 1);
  }
}

function drawCard(x, y, w, h, r, color) {
  if (r === undefined) r = 28;
  if (color === undefined) color = C.card;
  shadowBox(x, y, w, h, r);
  roundRect(x, y, w, h, r, color);
}

function shadowBox(x, y, w, h, r) {
  drawingContext.save();
  drawingContext.shadowOffsetX = 0;
  drawingContext.shadowOffsetY = 10;
  drawingContext.shadowBlur = 24;
  drawingContext.shadowColor = "rgba(97,74,58,0.08)";
  noStroke();
  fill(255);
  rect(x, y, w, h, r);
  drawingContext.restore();
}

function roundRect(x, y, w, h, r, color) {
  noStroke();
  fill(color);
  rect(x, y, w, h, r);
}

function labelText(str, x, y, color) {
  if (color === undefined) color = C.light;
  fill(color);
  textStyle(BOLD);
  textSize(11);
  textAlign(LEFT, TOP);
  text(str, x, y);
}

function titleText(str, x, y, size, color) {
  if (size === undefined) size = 18;
  if (color === undefined) color = C.dark;
  fill(color);
  textStyle(BOLD);
  textSize(size);
  textAlign(LEFT, TOP);
  text(str, x, y);
}

function normalText(str, x, y, size, color) {
  if (size === undefined) size = 14;
  if (color === undefined) color = C.muted;
  fill(color);
  textStyle(NORMAL);
  textSize(size);
  textAlign(LEFT, TOP);
  text(str, x, y);
}

function hit(mx, my, r) {
  return mx >= r.x && mx <= r.x + r.w && my >= r.y && my <= r.y + r.h;
}

function invisibleButton(x, y, w, h, callback) {
  buttons.push({ x: x, y: y, w: w, h: h, callback: callback });
}

function drawToast(msg) {
  roundRect(470, 30, 260, 44, 22, C.dark);
  fill("#FFFFFF");
  textStyle(BOLD);
  textSize(14);
  textAlign(CENTER, CENTER);
  text(msg, 600, 52);
}

function shortenText(str, maxLen) {
  if (!str) return "";
  if (str.length <= maxLen) return str;
  return str.substring(0, maxLen - 3) + "...";
}