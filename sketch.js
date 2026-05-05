// Pet Bowl - portfolio-ready responsive demo
// Google Sign-In restored with Firebase. Smart Setup Scan uses user's Teachable Machine model.

const MODEL_URL = "https://teachablemachine.withgoogle.com/models/h_jyjGvzN/";

let page = "login";
let loggedIn = false;
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
let buttons = [];
let inputs = [];
let activeInput = null;
let toast = "";
let toastTimer = 0;
let selectedRecipe = null;
let isGenerating = false;
let loadingStart = 0;
let fileInput;
let petPhoto;
let topSearch = "";
let recipeSearch = "";
let activeFilter = "All";
let currentPetIndex = 0;

let videoCapture = null;
let tmModel = null;
let tmReady = false;
let scanRunning = false;
let scanStatus = "Camera is off";
let scanLabel = "No result yet";
let scanConfidence = 0;
let scanFrames = [];
let scanInterval = null;

let C = {
  bg: "#F8F1EA", card: "#FFFDFC", brown: "#98735D", dark: "#49382F",
  muted: "#8E8177", light: "#B4A79F", cream: "#F2E7DC", green: "#DDE8D5",
  orange: "#F3C8A6", soft: "#FBF6F0", pink: "#F6E6DF", line: "#E6D8CC", red: "#A34A43",
  white: "#FFFFFF"
};

const petModes = {
  Dog: {
    goals: ["Balanced", "Sensitive Stomach", "Weight Loss", "Picky Eater", "Skin & Coat"],
    avoid: ["chocolate", "grapes", "onion", "garlic"],
    note: "Dog mode unlocks dog-safe goals, recipes, and avoid-food alerts."
  },
  Cat: {
    goals: ["Balanced", "Hairball Control", "Urinary Health", "Weight Control", "Picky Eater"],
    avoid: ["onion", "garlic", "chocolate", "milk"],
    note: "Cat mode changes the flow to cat-safe goals, smaller portions, and cat-specific alerts."
  }
};

let pets = [
  { name: "Loki", type: "Dog", weight: "20", age: "1", goal: "Sensitive Stomach", personality: "playful, picky eater", photo: null },
  { name: "Mochi", type: "Cat", weight: "10", age: "3", goal: "Hairball Control", personality: "quiet, picky eater", photo: null }
];
let pet = pets[0];

let recipes = [
  {title:"Chicken Pumpkin Gentle Bowl", type:"Dog", goals:["Sensitive Stomach"], tags:["dog","pumpkin","rice","gentle"], ingredients:"Chicken · Pumpkin · White Rice · Kibble", desc:"A soft bowl for dogs with sensitive digestion.", grams:["Chicken 75g","Pumpkin 30g","White rice 45g","Kibble 100g"], saved:true},
  {title:"Turkey Weight Control Bowl", type:"Dog", goals:["Weight Loss"], tags:["dog","turkey","green beans","low fat"], ingredients:"Turkey · Green Beans · Sweet Potato", desc:"Light, filling, and lower-fat for dog weight control.", grams:["Turkey 70g","Green beans 40g","Sweet potato 35g","Kibble 90g"], saved:false},
  {title:"Picky Eater Warm Topper", type:"Dog", goals:["Picky Eater"], tags:["dog","kibble","warm water","topper"], ingredients:"Kibble · Warm Water · Chicken Topper", desc:"Makes normal kibble easier to accept on picky days.", grams:["Kibble label amount","Warm water 20ml","Chicken topper 25g"], saved:true},
  {title:"Skin & Coat Salmon Bowl", type:"Dog", goals:["Skin & Coat"], tags:["dog","salmon","coat","carrot"], ingredients:"Salmon · Carrot · Rice · Kibble", desc:"A coat-focused bowl with simple ingredients.", grams:["Salmon 65g","Carrot 25g","Rice 40g","Kibble 100g"], saved:false},
  {title:"Balanced Daily Dog Bowl", type:"Dog", goals:["Balanced"], tags:["dog","balanced","chicken","carrot"], ingredients:"Chicken · Carrot · Sweet Potato · Kibble", desc:"A general daily bowl for dogs.", grams:["Chicken 80g","Carrot 30g","Sweet potato 50g","Kibble 110g"], saved:true},
  {title:"Cat Gentle Fish Bowl", type:"Cat", goals:["Balanced"], tags:["cat","salmon","pumpkin","gentle"], ingredients:"Salmon · Pumpkin · Cat Kibble", desc:"A small, simple bowl for cats.", grams:["Salmon 35g","Pumpkin 8g","Cat kibble 45g"], saved:false},
  {title:"Hairball Support Bowl", type:"Cat", goals:["Hairball Control"], tags:["cat","hairball","pumpkin","fiber"], ingredients:"Chicken · Pumpkin · Cat Kibble", desc:"A cat-focused bowl with a small fiber topper.", grams:["Chicken 30g","Pumpkin 8g","Cat kibble 45g"], saved:true},
  {title:"Urinary Support Wet Mix", type:"Cat", goals:["Urinary Health"], tags:["cat","urinary","wet food","hydration"], ingredients:"Wet Food · Warm Water · Chicken", desc:"Designed around hydration and gentle protein.", grams:["Wet food 55g","Warm water 20ml","Chicken 20g"], saved:false},
  {title:"Cat Weight Control Bowl", type:"Cat", goals:["Weight Control"], tags:["cat","weight","turkey","low fat"], ingredients:"Turkey · Pumpkin · Cat Kibble", desc:"A lighter cat bowl with smaller portions.", grams:["Turkey 28g","Pumpkin 6g","Cat kibble 38g"], saved:false},
  {title:"Kibble Only Helper", type:"Both", goals:["Balanced","Picky Eater"], tags:["dog","cat","kibble","busy day","saved"], ingredients:"Kibble · Warm Water · Safe Topper", desc:"For days when the owner only wants to improve regular kibble.", grams:["Kibble label amount","Warm water 15-25ml","Safe topper 5-20g"], saved:true}
];
let currentMeal = recipes[0];

function preload() { petPhoto = loadImage("loki.jpg", () => {}, () => { petPhoto = null; }); }
function setup() {
  createCanvas(windowWidth, windowHeight);
  textFont("Arial");
  fileInput = createFileInput(handleFile);
  fileInput.hide();
  setupFirebaseAuth();
}

function setupFirebaseAuth() {
  if (typeof firebase === "undefined") {
    authError = "Firebase library is missing. Check index.html.";
    authReady = true;
    return;
  }
  try {
    if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
    auth = firebase.auth();
    googleProvider = new firebase.auth.GoogleAuthProvider();
    auth.onAuthStateChanged(function(user) {
      currentUser = user;
      loggedIn = user !== null;
      authReady = true;
      if (loggedIn && page === "login") {
        page = "today";
        showToast("Signed in with Google");
      }
      if (!loggedIn) page = "login";
    });
  } catch (e) {
    authError = e.message || String(e);
    authReady = true;
  }
}

function signInWithGoogle() {
  authError = "";
  if (!auth || !googleProvider) {
    authError = "Google Sign-In is not ready yet.";
    showToast("Login not ready");
    return;
  }
  auth.signInWithPopup(googleProvider).catch(function(error) {
    authError = error.message || String(error);
    showToast("Google login failed");
  });
}

function signOutUser() {
  if (auth && currentUser && currentUser.email !== "demo@petbowl.app") {
    auth.signOut();
  } else {
    currentUser = null;
    loggedIn = false;
    page = "login";
    showToast("Signed out");
  }
}

function enterDemoMode() {
  currentUser = { displayName: "Demo User", email: "demo@petbowl.app" };
  loggedIn = true;
  page = "today";
  showToast("Demo opened");
}
function windowResized() { resizeCanvas(windowWidth, windowHeight); }

function draw() {
  let desiredH = loggedIn && page === "profile" ? profileContentHeight() : windowHeight;
  if (width !== windowWidth || height !== desiredH) resizeCanvas(windowWidth, desiredH);
  background(C.bg);
  buttons = [];
  inputs = [];
  drawBackgroundDecor();
  if (!loggedIn) { drawLoginPage(); drawToastIfNeeded(); return; }
  drawSidebar();
  drawTopBar();
  if (page === "today") drawToday();
  if (page === "plan") drawPlan();
  if (page === "recipes") drawRecipes();
  if (page === "profile") drawProfiles();
  if (page === "scan") drawSmartScan();
  if (showRightPanel()) drawRightPanel();
  if (isGenerating) drawGenerateOverlay();
  if (selectedRecipe) drawRecipeModal(selectedRecipe);
  drawToastIfNeeded();
}

function showRightPanel() { return width >= 1160 && !["scan", "login"].includes(page); }
function mainX() { return width >= 760 ? 270 : 24; }
function mainRight() { return showRightPanel() ? width - 360 : width - 36; }
function mainW() { return max(360, mainRight() - mainX()); }

function profileContentHeight() {
  if (!(loggedIn && page === "profile")) return windowHeight;
  let w = mainW();
  let cols = w > 760 ? 2 : 1;
  let rows = ceil(pets.length / cols);
  let startY = 225, cardH = 170, gap = 24;
  let listBottom = startY + rows * cardH + (rows-1) * gap;
  let editH = w > 760 ? 235 : 380;
  return max(windowHeight, listBottom + 32 + 52 + 82 + editH + 70);
}

function drawLoginPage() {
  let w = min(1040, width - 56);
  let h = min(620, height - 70);
  let x = (width - w) / 2;
  let y = (height - h) / 2;
  drawCard(x, y, w, h, 44, C.card);

  let twoCol = w >= 850;
  let leftW = twoCol ? w - 500 : w - 96;

  titleText("Pet Bowl", x + 60, y + 64, twoCol ? 54 : 44, C.dark);
  normalText("A gentle pet nutrition planner for picky pets and busy owners.", x + 62, y + 132, 19, C.muted, leftW);

  if (twoCol) {
    normalText("Create profiles, scan pet type, switch Dog/Cat nutrition logic, and save meal plans in one personal dashboard.", x + 62, y + 178, 15, C.muted, leftW - 20);
    drawMealBowlGraphic(x + 265, y + 390, 145);
    drawLoginFeatureCard(x + 65, y + h - 136, leftW - 20, 72);

    let bx = x + w - 430;
    drawCard(bx, y + 86, 350, 455, 36, C.bg);
    roundRect(bx + 116, y + 128, 118, 118, 60, C.cream);
    titleText("G", bx + 158, y + 166, 36, C.brown);
    titleText("Welcome back", bx + 56, y + 275, 31, C.dark);
    normalText("Sign in with Google to open your pet dashboard.", bx + 58, y + 320, 15, C.muted, 245);

    if (!authReady) {
      addButton(bx + 54, y + 380, 245, 56, "Loading login...", C.light, "#fff", () => {});
    } else {
      addButton(bx + 54, y + 380, 245, 56, "Continue with Google", C.brown, "#fff", signInWithGoogle);
    }
    addButton(bx + 54, y + 448, 245, 46, "Preview Demo", C.green, C.dark, enterDemoMode);

    if (authError) {
      normalText(shortenText(authError, 78), bx + 58, y + 510, 12, C.red, 245);
    } else {
      normalText("Profiles and meal preferences are ready for Firebase login.", bx + 58, y + 510, 12, C.muted, 245);
    }
  } else {
    normalText("Sign in to create pet profiles, scan Dog/Cat mode, and generate adaptive meal plans.", x + 60, y + 178, 15, C.muted, w - 120);
    drawMealBowlGraphic(x + w / 2, y + 325, 105);
    addButton(x + 60, y + h - 150, w - 120, 54, authReady ? "Continue with Google" : "Loading login...", C.brown, "#fff", authReady ? signInWithGoogle : () => {});
    addButton(x + 60, y + h - 86, w - 120, 44, "Preview Demo", C.green, C.dark, enterDemoMode);
    if (authError) normalText(shortenText(authError, 90), x + 60, y + h - 28, 12, C.red, w - 120);
  }
}

function drawLoginFeatureCard(x, y, w, h) {
  roundRect(x, y, w, h, 24, C.green);
  titleText("Smart setup", x + 24, y + 16, 17, C.dark);
  normalText("Dog/Cat mode changes goals, avoid-food alerts, and recipe categories.", x + 150, y + 17, 13, C.muted, max(120, w - 175));
}

function drawSidebar() {
  if (width < 760) return;
  drawCard(32, 28, 210, height - 56, 34, C.card);
  titleText("Pet Bowl", 72, 62, 25, C.brown);
  normalText("daily meal", 74, 96, 14, C.muted);
  navItem("today", "Today", "T", 68, 155);
  navItem("plan", "Create Plan", "P", 68, 218);
  navItem("recipes", "Recipes", "R", 68, 281);
  navItem("profile", "Profiles", "L", 68, 344);
  navItem("scan", "Smart Scan", "S", 68, 407);
  roundRect(62, height-132, 150, 92, 24, C.soft);
  titleText("Portfolio Demo", 82, height-114, 15, C.brown);
  normalText("Dog/Cat mode, real search, saved recipes, and smart setup.", 82, height-88, 12, C.muted, 112);
}
function navItem(target, label, icon, x, y) {
  let active = page === target;
  roundRect(x-15, y-14, 160, 48, 22, active ? C.brown : "rgba(0,0,0,0)");
  fill(active ? "#fff" : C.brown); textStyle(BOLD); textSize(16); textAlign(CENTER,CENTER); text(icon, x+13, y+10);
  fill(active ? "#fff" : C.dark); textAlign(LEFT,CENTER); textSize(14); text(label, x+48, y+10);
  invisibleButton(x-15, y-14, 160, 48, () => { page = target; activeInput = null; selectedRecipe = null; });
}

function drawTopBar() {
  let x = mainX(), w = mainW();
  titleText("Pet Bowl", x, 30, 34, C.dark);
  normalText("Personal meal planning for every pet profile", x, 72, 15, C.muted, w);
  if (width > 900) {
    let sx = min(width - 520, x + w - 430);
    if (sx > x + 260) {
      drawSearchInput("topSearch", topSearch, sx, 34, 250, 48, "Search pets, recipes, saved");
      addButton(sx+260, 36, 78, 44, "Search", C.brown, "#fff", () => { recipeSearch = topSearch; page = "recipes"; });
    }
    drawUserBadge(width - 160, 35);
  }
}

function drawUserBadge(x, y) {
  let name = currentUser && currentUser.displayName ? currentUser.displayName : "Demo User";
  roundRect(x, y, 122, 44, 22, C.card);
  fill(C.brown); textStyle(BOLD); textSize(13); textAlign(LEFT, CENTER);
  text(shortenText(name, 12), x + 18, y + 14);
  fill(C.muted); textStyle(NORMAL); textSize(11);
  text("Sign out", x + 18, y + 31);
  invisibleButton(x, y, 122, 44, signOutUser);
}

function currentMode() { return petModes[pet.type] || petModes.Dog; }
function syncModeDefaults() {
  let m = currentMode();
  if (!m.goals.includes(pet.goal)) pet.goal = m.goals[0];
}

function drawToday() {
  syncModeDefaults();
  let x = mainX(), w = mainW();
  titleText("Today's Meal", x, 130, 32, C.dark);
  normalText(`Made for ${pet.name}. The app uses profile details, pet type, goal, saved recipes, and safe-food alerts.`, x, 170, 15, C.muted, w-20);

  let cardW = min(620, w);
  drawCard(x, 220, cardW, 292, 34, C.card);
  labelText("TODAY'S BOWL", x+32, 248);
  titleText(currentMeal.title, x+32, 278, 27, C.brown, cardW-64);
  normalText(currentMeal.ingredients, x+32, 318, 16, C.dark, cardW-64);
  normalText(currentMeal.desc, x+32, 350, 15, C.muted, cardW-70);
  drawWrappedChipList(currentMeal.grams, x+32, 390, cardW-64, 36, C.soft, C.dark);
  addButton(x+32, 455, 145, 42, "Save Recipe", C.brown, "#fff", () => { currentMeal.saved = true; showToast("Recipe saved"); });
  addButton(x+195, 455, 145, 42, "View Recipes", C.green, C.dark, () => { page = "recipes"; });

  let y2 = 545;
  drawCard(x, y2, cardW, 118, 30, C.card);
  labelText(`${pet.type.toUpperCase()} NUTRITION MODE`, x+32, y2+26);
  normalText(currentMode().note, x+32, y2+56, 15, C.muted, cardW-64);

  drawCard(x, y2+145, cardW, 86, 28, C.green);
  titleText("Avoid-food alert", x+32, y2+166, 18, C.dark);
  normalText(currentMode().avoid.join(" · "), x+190, y2+169, 15, C.muted, cardW-220);
}

function drawPlan() {
  syncModeDefaults();
  let x = mainX(), w = mainW();
  titleText("Create Meal Plan", x, 130, 32, C.dark);
  normalText("Create or edit a pet profile. Weight and age use fixed units, so users only enter numbers.", x, 170, 15, C.muted, w-20);

  drawCard(x, 215, w, 160, 32, C.card);
  labelText("PET NAME", x+28, 242); inputBox("name", pet.name, x+28, 266, min(240,w/2-45), 50);
  labelText("PET TYPE", x+min(310,w/2+20), 242);
  addPill(x+min(310,w/2+20), 266, 88, 44, "Dog", pet.type === "Dog", () => { pet.type="Dog"; syncModeDefaults(); });
  addPill(x+min(410,w/2+120), 266, 88, 44, "Cat", pet.type === "Cat", () => { pet.type="Cat"; syncModeDefaults(); });
  addButton(x+w-150, 266, 118, 44, "Smart Scan", C.green, C.dark, () => { page="scan"; });

  drawCard(x, 405, w, 150, 32, C.card);
  labelText("WEIGHT", x+28, 432); inputBox("weight", pet.weight, x+28, 456, 150, 50, true); unitLabel("lbs", x+188, 456, 65, 50);
  labelText("AGE", x+290, 432); inputBox("age", pet.age, x+290, 456, 130, 50, true); unitLabel("years", x+430, 456, 82, 50);

  let gy = 585;
  drawCard(x, gy, w, 142, 32, C.card);
  labelText(`${pet.type.toUpperCase()} GOALS`, x+28, gy+24);
  drawGoalChips(x+28, gy+52, w-56);
  addButton(x, gy+172, w, 52, `Generate ${pet.type} Meal Plan`, C.brown, "#fff", () => { loadingStart = millis(); isGenerating=true; });
}
function drawGoalChips(x,y,w) {
  let xx=x, yy=y;
  for (let g of currentMode().goals) {
    let bw = constrain(textWidthQuick(g)+42, 90, 185);
    if (xx + bw > x+w) { xx = x; yy += 52; }
    addPill(xx, yy, bw, 42, g, pet.goal === g, () => { pet.goal = g; });
    xx += bw + 12;
  }
}
function unitLabel(str,x,y,w,h){ roundRect(x,y,w,h,16,C.cream); titleText(str,x+13,y+16,15,C.brown); }

function drawRecipes() {
  let x = mainX(), w = mainW();
  titleText("Recipe Search", x, 130, 32, C.dark);
  normalText("Search by goal, pet name, ingredient, saved item, or special need. Results adapt to Dog/Cat mode.", x, 170, 15, C.muted, w-20);

  drawCard(x, 215, w, 72, 30, C.card);
  labelText("SEARCH", x+24, 238);
  drawSearchInput("recipeSearch", recipeSearch, x+105, 226, max(180,w-250), 48, "try pumpkin, saved, cat, kibble");
  addButton(x+w-120, 228, 92, 44, "Clear", C.soft, C.brown, () => { recipeSearch=""; activeFilter="All"; });

  let filters = ["All", "Saved", ...currentMode().goals, "Kibble"];
  drawChipWrap(filters, x, 316, w, activeFilter, (f)=>{ activeFilter=f; });

  let results = filteredRecipes();
  let cols = w > 760 ? 2 : 1;
  let cardW = cols === 2 ? (w-24)/2 : w;
  let startY = 415;
  if (!results.length) normalText("No matching recipes yet. Try another ingredient or goal.", x, startY, 16, C.muted, w);
  results.slice(0,6).forEach((r,i)=>{
    let cx = x + (i%cols)*(cardW+24);
    let cy = startY + floor(i/cols)*158;
    recipeCard(r,cx,cy,cardW,130);
  });
}
function drawChipWrap(items,x,y,w,active,cb) {
  let xx=x, yy=y;
  for (let item of items) {
    let bw = constrain(textWidthQuick(item)+42, 80, 190);
    if (xx + bw > x+w) { xx=x; yy+=52; }
    addPill(xx, yy, bw, 42, item, item===active, () => cb(item));
    xx += bw + 12;
  }
}
function recipeCard(r,x,y,w,h) {
  drawCard(x,y,w,h,28,C.card);
  titleText(r.title, x+26, y+22, 20, C.dark, w-52);
  normalText(r.ingredients, x+26, y+55, 14, C.brown, w-52);
  normalText(r.desc, x+26, y+84, 14, C.muted, w-52);
  if (r.saved) { roundRect(x+w-92,y+20,66,30,15,C.green); titleText("SAVED",x+w-78,y+27,11,C.brown); }
  invisibleButton(x,y,w,h,()=>{selectedRecipe=r;});
}
function filteredRecipes() {
  let q = (recipeSearch || topSearch || "").toLowerCase().trim();
  let list = recipes.filter(r => r.type === pet.type || r.type === "Both");
  if (activeFilter !== "All") {
    if (activeFilter === "Saved") list = list.filter(r => r.saved);
    else list = list.filter(r => r.goals.includes(activeFilter) || r.tags.includes(activeFilter.toLowerCase()) || r.title.toLowerCase().includes(activeFilter.toLowerCase()));
  }
  if (q) {
    list = list.filter(r => {
      let s = [r.title, r.type, r.ingredients, r.desc, r.tags.join(" "), r.goals.join(" "), r.saved?"saved":"", pet.name].join(" ").toLowerCase();
      return s.includes(q);
    });
  }
  return list;
}

function drawProfiles() {
  let x = mainX(), w = mainW();
  titleText("Pet Profiles", x, 130, 32, C.dark);
  normalText("Each pet can have its own name, photo, type, weight, age, goal, and food alerts.", x, 170, 15, C.muted, w-20);

  // Profile cards now use a real grid height, so the Add/Edit section never covers the cards.
  let cols = w > 760 ? 2 : 1;
  let gap = 24;
  let cardW = cols === 2 ? (w-gap)/2 : w;
  let cardH = 170;
  let startY = 225;

  pets.forEach((p,i)=>{
    let cx = x+(i%cols)*(cardW+gap);
    let cy = startY+floor(i/cols)*(cardH+gap);
    drawCard(cx,cy,cardW,cardH,30,i===currentPetIndex?C.green:C.card);
    drawPetAvatar(cx+70,cy+78,82,p);
    titleText(p.name,cx+128,cy+30,23,C.dark,cardW-156);
    normalText(`${p.type} · ${p.weight} lbs · ${p.age} years`,cx+128,cy+66,14,C.muted,cardW-156);
    normalText(p.goal,cx+128,cy+94,15,C.brown,cardW-156);
    addButton(cx+128,cy+124,125,36,"Use Profile",C.brown,"#fff",()=>{currentPetIndex=i; pet=pets[i]; if(p.photo) petPhoto=p.photo; syncModeDefaults();});
  });

  let rows = ceil(pets.length / cols);
  let listBottom = startY + rows * cardH + (rows-1) * gap;
  let addY = listBottom + 32;

  addButton(x,addY,w,52,"Add New Pet Profile",C.brown,"#fff",()=>{
    let n={name:"New Pet",type:"Dog",weight:"20",age:"1",goal:"Balanced",personality:"new profile",photo:null};
    pets.push(n); currentPetIndex=pets.length-1; pet=n; syncModeDefaults(); showToast("New profile added");
  });

  let editY = addY + 82;
  let editH = w > 760 ? 235 : 380;
  drawCard(x,editY,w,editH,30,C.card);
  labelText("EDIT CURRENT PROFILE",x+28,editY+30);

  if (w > 760) {
    labelText("NAME",x+28,editY+68);
    inputBox("name",pet.name,x+28,editY+92,210,46);

    labelText("PERSONALITY",x+265,editY+68);
    inputBox("personality",pet.personality,x+265,editY+92,min(300,w-625),46);

    addButton(x+w-210,editY+92,170,46,"Upload Photo",C.green,C.dark,()=>fileInput.elt.click());

    labelText("TYPE",x+28,editY+152);
    addPill(x+28,editY+174,82,40,"Dog",pet.type==="Dog",()=>{pet.type="Dog"; syncModeDefaults();});
    addPill(x+120,editY+174,82,40,"Cat",pet.type==="Cat",()=>{pet.type="Cat"; syncModeDefaults();});

    labelText("FIXED UNITS",x+230,editY+152);
    normalText(`${pet.weight} lbs · ${pet.age} years`,x+230,editY+181,15,C.muted,150);

    labelText("AVOID FOOD ALERTS",x+430,editY+152);
    normalText(currentMode().avoid.join(" · "),x+430,editY+181,14,C.muted,w-470);
  } else {
    labelText("NAME",x+28,editY+68);
    inputBox("name",pet.name,x+28,editY+92,w-56,46);
    labelText("PERSONALITY",x+28,editY+152);
    inputBox("personality",pet.personality,x+28,editY+176,w-56,46);
    labelText("TYPE",x+28,editY+236);
    addPill(x+28,editY+258,82,40,"Dog",pet.type==="Dog",()=>{pet.type="Dog"; syncModeDefaults();});
    addPill(x+120,editY+258,82,40,"Cat",pet.type==="Cat",()=>{pet.type="Cat"; syncModeDefaults();});
    addButton(x+28,editY+314,w-56,46,"Upload Photo",C.green,C.dark,()=>fileInput.elt.click());
  }
}

function drawSmartScan() {
  let x = mainX(), w = mainW();
  titleText("Smart Setup Scan", x, 130, 32, C.dark);
  normalText("The scan starts the correct setup flow. After it detects Dog or Cat, goals, avoid-food alerts, and recipes change automatically.", x, 170, 15, C.muted, min(w-20, 760));

  let cardY = 215;
  let compact = w < 760;
  let cardH = compact ? 660 : min(500, height - 310);
  drawCard(x, cardY, w, cardH, 34, C.card);

  let camX = x + 32;
  let camY = cardY + 58;
  let camW = compact ? w - 64 : min(620, w * 0.62);
  let camH = compact ? 300 : min(330, cardH - 150);
  drawCameraFrame(camX, camY, camW, camH);

  if (compact) {
    drawScanPanel(x + 32, camY + camH + 28, w - 64, 190);
    let by = cardY + cardH - 78;
    let bw = (w - 88) / 3;
    addButton(x+32, by, bw, 48, videoCapture ? "Scan Again" : "Start Camera", C.brown, "#fff", startSmartCamera);
    addButton(x+44+bw, by, bw, 48, "Stop", C.soft, C.brown, stopSmartCamera);
    addButton(x+56+bw*2, by, bw, 48, "Use Setup", C.green, C.dark, useScanResult);
  } else {
    let panelX = camX + camW + 34;
    let panelW = w - (panelX - x) - 32;
    drawScanPanel(panelX, cardY + 58, panelW, min(330, cardH - 140));
    let by = cardY + cardH - 76;
    addButton(camX, by, 160, 48, videoCapture ? "Scan Again" : "Start Camera", C.brown, "#fff", startSmartCamera);
    addButton(camX+180, by, 130, 48, "Stop", C.soft, C.brown, stopSmartCamera);
    addButton(camX+330, by, 180, 48, "Use Smart Setup", C.green, C.dark, useScanResult);
  }

  let infoY = cardY + cardH + 32;
  drawCard(x, infoY, w, 84, 26, C.soft);
  titleText("Why this matters", x+28, infoY+26, 18, C.dark);
  normalText("It prevents dog and cat nutrition advice from being mixed together and reduces manual setup.", x+210, infoY+28, 15, C.muted, w-250);
}
function drawVideoCover(videoEl, x, y, w, h) {
  // draw video like CSS object-fit: cover, so the camera fills the whole frame
  let el = videoEl && videoEl.elt ? videoEl.elt : null;
  if (!el || !el.videoWidth || !el.videoHeight) return false;
  let vw = el.videoWidth, vh = el.videoHeight;
  let scale = max(w / vw, h / vh);
  let sw = w / scale;
  let sh = h / scale;
  let sx = (vw - sw) / 2;
  let sy = (vh - sh) / 2;
  drawingContext.drawImage(el, sx, sy, sw, sh, x, y, w, h);
  return true;
}
function drawCameraFrame(x,y,w,h) {
  roundRect(x,y,w,h,28,"#5B4438");
  if (videoCapture) {
    push();
    drawingContext.save();
    drawingContext.beginPath();
    drawingContext.roundRect(x,y,w,h,28);
    drawingContext.clip();
    // Mirror the camera, then crop it to cover the full rounded rectangle.
    translate(x + w, y);
    scale(-1, 1);
    let ok = drawVideoCover(videoCapture, 0, 0, w, h);
    if (!ok) image(videoCapture, 0, 0, w, h);
    drawingContext.restore();
    pop();
  } else {
    fill("rgba(255,255,255,.16)"); circle(x+w/2,y+h/2,min(w,h)*0.48);
    fill(C.cream); circle(x+w/2,y+h/2,min(w,h)*0.34);
    titleText("START CAMERA", x+w/2-95, y+h/2-18, 22, C.brown);
  }
}
function drawScanPanel(x,y,w,h) {
  if (w < 230) return;
  let result = scanLabel.includes("Dog") ? "Dog" : scanLabel.includes("Cat") ? "Cat" : "No result";
  roundRect(x, y, min(190,w), 52, 26, result==="No result"?C.soft:C.green);
  titleText(result, x+28, y+14, 18, C.dark);
  titleText("Adaptive setup", x, y+86, 24, C.dark);
  normalText(scanStatus, x, y+126, 14, scanStatus.includes("error")||scanStatus.includes("missing")?C.red:C.muted, w);
  labelText("MODEL RESULT", x, y+178);
  normalText(`${scanLabel} ${scanConfidence ? "· " + nf(scanConfidence*100,1,0) + "%" : ""}`, x, y+202, 15, C.dark, w);
  labelText("AFTER SCAN", x, y+245);
  normalText(`${pet.type} goals: ${currentMode().goals.join(" · ")}`, x, y+268, 13, C.muted, w);
}
async function startSmartCamera() {
  scanStatus = "Starting camera...";
  scanLabel = "No result yet";
  scanConfidence = 0;
  scanFrames = [];
  if (typeof tmImage === "undefined") {
    scanStatus = "TM library missing. Check index.html: tfjs and @teachablemachine/image must load before sketch.js.";
    showToast("TM library missing");
    return;
  }
  try {
    if (!tmModel) {
      scanStatus = "Loading AI model...";
      tmModel = await tmImage.load(MODEL_URL + "model.json", MODEL_URL + "metadata.json");
      tmReady = true;
    }
    if (!videoCapture) {
      videoCapture = createCapture(VIDEO, () => { scanStatus = "Camera is on. Place pet inside the frame."; });
      videoCapture.size(640, 480);
      videoCapture.hide();
    }
    scanRunning = true;
    if (scanInterval) clearInterval(scanInterval);
    scanInterval = setInterval(runPrediction, 700);
  } catch (e) {
    console.error(e);
    scanStatus = "Camera or model error. Use Live Server/localhost or GitHub Pages, then allow camera permission.";
    showToast("Camera/model error");
  }
}
async function runPrediction() {
  if (!scanRunning || !tmReady || !videoCapture) return;
  try {
    let preds = await tmModel.predict(videoCapture.elt);
    let top = preds.sort((a,b)=>b.probability-a.probability)[0];
    if (!top) return;
    let name = normalizePetLabel(top.className);
    scanLabel = `${name} (${top.className})`;
    scanConfidence = top.probability;
    scanFrames.push({name, p: top.probability});
    if (scanFrames.length > 8) scanFrames.shift();
    let vote = stableScanVote();
    if (vote === "Dog" || vote === "Cat") {
      pet.type = vote;
      syncModeDefaults();
      scanStatus = `${vote} mode ready. Goals, avoid foods, and recipes have been updated.`;
    } else if (vote === "NotPet") {
      scanStatus = "No pet detected yet. Move the pet closer and fill the frame.";
    } else {
      scanStatus = "Scanning... hold still for a moment.";
    }
  } catch(e) {
    console.error(e);
    scanStatus = "Prediction error. Try restarting the camera.";
  }
}
function normalizePetLabel(label) {
  let l = (label||"").toLowerCase();
  if (l.includes("dog")) return "Dog";
  if (l.includes("cat")) return "Cat";
  if (l.includes("not")) return "NotPet";
  return label;
}
function stableScanVote() {
  let scores = {Dog:0, Cat:0, NotPet:0};
  scanFrames.forEach(f => { if(scores[f.name] !== undefined) scores[f.name] += f.p; });
  let best = Object.keys(scores).sort((a,b)=>scores[b]-scores[a])[0];
  return scores[best] > 1.2 ? best : "";
}
function stopSmartCamera() {
  scanRunning = false;
  if (scanInterval) clearInterval(scanInterval);
  scanInterval = null;
  if (videoCapture) {
    try { videoCapture.elt.srcObject?.getTracks().forEach(t=>t.stop()); } catch(e) {}
    videoCapture.remove();
    videoCapture = null;
  }
  scanStatus = "Camera stopped";
}
function useScanResult() {
  if (pet.type === "Dog" || pet.type === "Cat") {
    syncModeDefaults();
    page = "plan";
    showToast(`${pet.type} smart setup applied`);
  } else showToast("Scan Dog or Cat first");
}

function drawRightPanel() {
  let x = width - 330;
  drawCard(x, 130, 300, height-180, 34, C.card);
  drawPetAvatar(x+150, 215, 108, pet);
  titleText(shortenText(pet.name,12), x+82, 285, 30, C.brown, 170);
  normalText(`${pet.type} profile · ${pet.personality}`, x+55, 328, 14, C.muted, 190);
  miniStat(x+40, 376, 105, 82, "WEIGHT", pet.weight+" lbs");
  miniStat(x+158, 376, 105, 82, "AGE", pet.age+" years");
  roundRect(x+40, 485, 222, 76, 24, C.soft); labelText("TODAY'S GOAL", x+65, 503); titleText(shortenText(pet.goal,18), x+65, 529, 19, C.dark, 180);
  roundRect(x+40, 588, 222, 92, 24, C.green); titleText("Adaptive Logic", x+65, 608, 18, C.dark); normalText("Goals, avoid foods, and recipes change with Dog/Cat mode.", x+65, 638, 13, C.muted, 170);
}
function miniStat(x,y,w,h,label,value){ roundRect(x,y,w,h,22,C.soft); labelText(label,x+16,y+16); titleText(value,x+16,y+42,17,C.dark); }

function drawGenerateOverlay() {
  let elapsed = millis()-loadingStart;
  fill("rgba(74,58,49,.28)"); noStroke(); rect(0,0,width,height);
  drawCard(width/2-220, height/2-205, 440, 410, 34, C.card);
  drawMealBowlGraphic(width/2, height/2-55, 120);
  titleText(`Preparing ${pet.name}'s bowl...`, width/2-150, height/2+42, 22, C.dark);
  normalText("Matching pet type, goal, and safe-food alerts.", width/2-150, height/2+82, 14, C.muted, 300);
  if (elapsed>1600) {
    currentMeal = recipes.find(r => (r.type===pet.type || r.type==="Both") && r.goals.includes(pet.goal)) || recipes.find(r=>r.type===pet.type) || recipes[0];
    isGenerating = false; page = "today"; showToast("Meal plan ready");
  }
}
function drawRecipeModal(r) {
  fill("rgba(74,58,49,.25)"); noStroke(); rect(0,0,width,height);
  let mw = min(560, width-70), mh=520, x=(width-mw)/2, y=(height-mh)/2;
  drawCard(x,y,mw,mh,34,C.card);
  titleText(r.title,x+36,y+35,26,C.dark,mw-72);
  normalText(r.desc,x+36,y+76,15,C.muted,mw-72);
  labelText("INGREDIENTS",x+36,y+132); normalText(r.ingredients,x+36,y+158,17,C.brown,mw-72);
  labelText("PORTION GUIDE",x+36,y+220); r.grams.forEach((g,i)=>normalText(g,x+36,y+248+i*28,15,C.dark,mw-72));
  roundRect(x+36,y+385,mw-72,54,18,C.green); normalText(`Mode: ${r.type}. Always check allergies and vet guidance for special conditions.`,x+56,y+402,13,C.dark,mw-112);
  addButton(x+36,y+460,130,42,r.saved?"Saved":"Save",C.brown,"#fff",()=>{r.saved=true;selectedRecipe=null;showToast("Recipe saved");});
  addButton(x+185,y+460,130,42,"Use Plan",C.green,C.dark,()=>{currentMeal=r; selectedRecipe=null; page="today";});
  addButton(x+mw-136,y+460,100,42,"Close",C.soft,C.brown,()=>{selectedRecipe=null;});
}

function handleFile(file) {
  if (file.type === "image") {
    loadImage(file.data, img => { petPhoto = img; pet.photo = img; pets[currentPetIndex].photo = img; showToast("Photo updated"); });
  }
}

function drawBackgroundDecor(){ noStroke(); fill("rgba(255,255,255,.35)"); circle(width-150,120,220); fill("rgba(221,232,213,.32)"); circle(width-160,height-120,240); fill("rgba(246,230,223,.50)"); circle(380,height-90,190); }
function drawMealBowlGraphic(cx,cy,size){ noStroke(); fill(C.cream); ellipse(cx,cy+size*.25,size*1.35,size*.72); fill(C.orange); circle(cx-size*.22,cy,size*.34); fill(C.green); circle(cx+size*.16,cy-size*.03,size*.32); fill(C.brown); circle(cx+size*.03,cy+size*.1,size*.22); fill("#fff"); ellipse(cx,cy+size*.22,size*1.08,size*.35); }
function drawPetAvatar(cx,cy,size,p=pet){ noStroke(); fill("#E8D8CB"); circle(cx,cy,size); let img = p.photo || (p===pet ? petPhoto : null); if(img && img.width>1){ drawingContext.save(); drawingContext.beginPath(); drawingContext.arc(cx,cy,size/2-2,0,TWO_PI); drawingContext.clip(); imageMode(CENTER); image(img,cx,cy,size,size); drawingContext.restore(); } else { fill(C.brown); textStyle(BOLD); textSize(size>80?22:14); textAlign(CENTER,CENTER); text((p.name||"PET").substring(0,4).toUpperCase(),cx,cy); } }
function drawCard(x,y,w,h,r,color){ shadowBox(x,y,w,h,r); roundRect(x,y,w,h,r,color||C.card); }
function shadowBox(x,y,w,h,r){ drawingContext.save(); drawingContext.shadowOffsetY=10; drawingContext.shadowBlur=24; drawingContext.shadowColor="rgba(97,74,58,.08)"; noStroke(); fill(255); rect(x,y,w,h,r); drawingContext.restore(); }
function roundRect(x,y,w,h,r,color){ noStroke(); fill(color); rect(x,y,w,h,r); }
function labelText(str,x,y,color){ fill(color||C.light); textStyle(BOLD); textSize(11); textAlign(LEFT,TOP); text(str,x,y); }
function titleText(str,x,y,size,color,w){ fill(color||C.dark); textStyle(BOLD); textSize(size||18); textAlign(LEFT,TOP); if(w) text(str,x,y,w); else text(str,x,y); }
function normalText(str,x,y,size,color,w){ fill(color||C.muted); textStyle(NORMAL); textSize(size||14); textAlign(LEFT,TOP); if(w) text(str,x,y,w); else text(str,x,y); }
function addButton(x,y,w,h,label,bg,txt,cb){ let hover=hit(mouseX,mouseY,{x,y,w,h}); roundRect(x,y+(hover?-2:0),w,h,22,bg); fill(txt); textStyle(BOLD); textSize(label.length>18?13:15); textAlign(CENTER,CENTER); text(label,x+w/2,y+h/2+(hover?-2:0)); invisibleButton(x,y,w,h,cb); }
function addPill(x,y,w,h,label,active,cb){ let hover=hit(mouseX,mouseY,{x,y,w,h}); roundRect(x,y+(hover?-2:0),w,h,h/2,active?C.brown:C.card); fill(active?"#fff":C.brown); textStyle(BOLD); textSize(label.length>16?12:14); textAlign(CENTER,CENTER); text(label,x+w/2,y+h/2+(hover?-2:0)); invisibleButton(x,y,w,h,cb); }
function drawSearchInput(id,value,x,y,w,h,ph){ roundRect(x,y,w,h,22,C.card); fill(value?C.dark:C.light); textStyle(NORMAL); textSize(14); textAlign(LEFT,CENTER); let display=value||ph; if(activeInput===id && frameCount%60<30) display=value+"|"; text(shortenText(display, Math.floor(w/9)),x+22,y+h/2); inputs.push({id,x,y,w,h}); }
function inputBox(id,value,x,y,w,h,numeric){ roundRect(x,y,w,h,16,C.soft); fill(activeInput===id?C.dark:C.muted); textStyle(BOLD); textSize(16); textAlign(LEFT,CENTER); let display=value; if(activeInput===id && frameCount%60<30) display += "|"; text(shortenText(display,Math.floor(w/9)),x+16,y+h/2); inputs.push({id,x,y,w,h,numeric}); }
function drawWrappedChipList(items,x,y,w,h,bg,txt){ let xx=x, yy=y; for(let item of items){ let bw=constrain(textWidthQuick(item)+36,95,170); if(xx+bw>x+w){ xx=x; yy+=h+8; } roundRect(xx,yy,bw,h,16,bg); normalText(item,xx+16,yy+11,12,txt); xx+=bw+10; } }
function mousePressed(){ activeInput=null; for(let i of inputs){ if(hit(mouseX,mouseY,i)){ activeInput=i.id; return; } } for(let i=buttons.length-1;i>=0;i--){ if(hit(mouseX,mouseY,buttons[i])){ buttons[i].callback(); return; } } }
function keyPressed(){ if(!activeInput) return; if(keyCode===BACKSPACE){ editInput("backspace"); return; } if(keyCode===ENTER || keyCode===RETURN){ activeInput=null; return; } if(key.length===1) editInput(key); }
function editInput(v){ let numeric=activeInput==="weight"||activeInput==="age"; if(numeric && v!=="backspace" && !/[0-9.]/.test(v)) return; if(activeInput==="name"){ pet.name=editText(pet.name,v,16); } if(activeInput==="personality") pet.personality=editText(pet.personality,v,28); if(activeInput==="weight") pet.weight=editText(pet.weight,v,5); if(activeInput==="age") pet.age=editText(pet.age,v,3); if(activeInput==="recipeSearch") recipeSearch=editText(recipeSearch,v,30); if(activeInput==="topSearch") topSearch=editText(topSearch,v,30); }
function editText(s,v,max){ if(v==="backspace") return s.slice(0,-1); if(s.length>=max) return s; return s+v; }
function invisibleButton(x,y,w,h,callback){ buttons.push({x,y,w,h,callback}); }
function hit(mx,my,r){ return mx>=r.x && mx<=r.x+r.w && my>=r.y && my<=r.y+r.h; }
function showToast(msg){ toast=msg; toastTimer=120; }
function drawToastIfNeeded(){ if(toastTimer>0){ toastTimer--; roundRect(width/2-130,28,260,44,22,C.dark); fill("#fff"); textStyle(BOLD); textSize(14); textAlign(CENTER,CENTER); text(toast,width/2,50); } }
function shortenText(str,maxLen){ if(!str) return ""; return str.length<=maxLen?str:str.substring(0,maxLen-3)+"..."; }
function textWidthQuick(str){ textSize(14); textStyle(BOLD); return textWidth(str); }
