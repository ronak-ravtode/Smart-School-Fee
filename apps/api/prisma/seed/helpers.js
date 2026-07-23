const { faker } = require('@faker-js/faker');

faker.seed(20260723);

const CLASSES = [
  'Nursery', 'LKG', 'UKG',
  '1A','1B','2A','2B','3A','3B','4A','4B',
  '5A','5B','6A','6B','7A','7B','8A','8B','9A','9B','10A','10B',
  '11 Science','11 Commerce','12 Science','12 Commerce'
];

const CLASS_GROUPS = {
  'Nursery': 'primary', 'LKG': 'primary', 'UKG': 'primary',
  '1A': 'primary','1B': 'primary','2A': 'primary','2B': 'primary',
  '3A': 'primary','3B': 'primary','4A': 'primary','4B': 'primary',
  '5A': 'primary','5B': 'primary',
  '6A': 'middle','6B': 'middle','7A': 'middle','7B': 'middle',
  '8A': 'middle','8B': 'middle',
  '9A': 'secondary','9B': 'secondary','10A': 'secondary','10B': 'secondary',
  '11 Science': 'higher','11 Commerce': 'higher','12 Science': 'higher','12 Commerce': 'higher'
};

const STUDENTS_PER_CLASS = {
  'Nursery':15,'LKG':15,'UKG':15,
  '1A':14,'1B':14,'2A':14,'2B':14,'3A':13,'3B':13,
  '4A':13,'4B':13,'5A':13,'5B':13,
  '6A':13,'6B':12,'7A':13,'7B':13,
  '8A':12,'8B':12,'9A':11,'9B':11,'10A':11,'10B':11,
  '11 Science':6,'11 Commerce':5,'12 Science':6,'12 Commerce':5
};

const GUJARATI_SURNAMES = [
  'Patel','Shah','Mehta','Desai','Joshi','Trivedi','Dave','Modi',
  'Acharya','Bhatt','Pandya','Rawal','Solanki','Vyas','Thakkar','Zaveri',
  'Bhalodia','Chauhan','Doshi','Gandhi','Hathi','Iyer','Jhaveri','Kotecha',
  'Lakhani','Majmudar','Nagda','Oza','Parikh','Raval','Sanghvi','Trivedi'
];

const HINDI_SURNAMES = [
  'Sharma','Verma','Singh','Kumar','Yadav','Gupta','Mishra','Tiwari',
  'Pandey','Dubey','Srivastava','Agarwal','Jain','Saxena','Choudhary',
  'Rathore','Thakur','Prajapati','Rajput','Pandit','Dwivedi','Tripathi'
];

const MARATHI_SURNAMES = [
  'Deshmukh','Kulkarni','Jadhav','Patil','Shinde','More','Pawar','Sawant',
  'Kadam','Gawande','Mahajan','Wagh','Bhosale','Chavan','Nikam','Sathe'
];

const SOUTH_INDIAN_SURNAMES = [
  'Iyer','Iyengar','Nair','Menon','Reddy','Rao','Naidu','Murthy',
  'Pillai','Varma','Sastry','Acharya','Hegde','Shetty','Kurup','Nambiar'
];

const ALL_SURNAMES = [
  ...GUJARATI_SURNAMES, ...HINDI_SURNAMES,
  ...MARATHI_SURNAMES, ...SOUTH_INDIAN_SURNAMES
];

const MALE_NAMES = [
  'Aarav','Vihaan','Vivaan','Ansh','Reyansh','Dhruv','Arjun','Om',
  'Atharv','Krish','Ishaan','Ayaan','Aryan','Shiv','Pranav','Yash',
  'Rudra','Dev','Shaurya','Nakul','Sahil','Rohan','Kunal','Harsh',
  'Jay','Karan','Mihir','Neel','Parth','Raj','Siddharth','Tanmay',
  'Uday','Varun','Yash','Chirag','Fenil','Hitesh','Jignesh','Keyur',
  'Manish','Nikhil','Prakash','Rajesh','Suresh','Dinesh','Mukesh',
  'Amit','Sunil','Anil','Sanjay','Vijay','Ajay','Vipul','Bhavik'
];

const FEMALE_NAMES = [
  'Aanya','Anaya','Diya','Ishita','Jiya','Kavya','Navya','Pari',
  'Riya','Sara','Tanya','Vanya','Zara','Aditi','Bhavna','Charvi',
  'Dhriti','Esha','Gauri','Harsha','Isha','Jhanvi','Kiara','Lavanya',
  'Manya','Nisha','Ojasvi','Priya','Rashi','Sneha','Tara','Uma',
  'Vaishali','Anjali','Shreya','Neha','Pooja','Rina','Sonal',
  'Kriti','Nandini','Pallavi','Radhika','Swati','Trisha','Vidhi'
];

const OCCUPATIONS = [
  'Software Engineer','Business Owner','Teacher','Government Employee',
  'Doctor','Lawyer','Bank Manager','Chartered Accountant',
  'Shop Owner','Farmer','Architect','Civil Engineer',
  'Professor','Police Officer','Nurse','Pharmacist',
  'Diamond Merchant','Textile Trader','Real Estate Agent','Driver'
];

const CITIES = [
  'Ahmedabad','Vadodara','Surat','Rajkot','Bhavnagar','Jamnagar',
  'Mumbai','Pune','Nagpur','Nashik','Thane','Aurangabad',
  'Delhi','Jaipur','Udaipur','Jodhpur','Indore','Bhopal',
  'Chennai','Bangalore','Hyderabad','Kochi','Vijayawada'
];

const BOUNCE_REASONS = [
  'Insufficient funds','Signature mismatch','Account closed',
  'Refer to drawer','Amount in words mismatch','Post-dated cheque',
  'Account blocked','Stale cheque','Alteration in amount','Frozen account'
];

const WAIVER_REASONS = {
  'Sibling Discount': 'Sibling studying in same institution',
  'Merit Scholarship': 'Outstanding academic performance',
  'Sports Scholarship': 'State/National level sports achievement',
  'Staff Child': 'Child of school staff member',
  'Economically Weaker Section': 'Economically weaker section scholarship'
};

const PENALTY_REASONS = {
  'Late Fee': 'Fee payment delayed beyond due date',
  'Cheque Bounce': 'Cheque returned unpaid by bank',
  'Manual Penalty': 'Penalty imposed by administration',
  'Repeated Delay': 'Repeated late payment of fees'
};

const EXPENSE_CATEGORIES = {
  'Electricity': 'utilities',
  'Cleaning': 'cleaning',
  'Security': 'watchman',
  'Repairs': 'repairs',
  'Internet': 'utilities',
  'Furniture': 'repairs',
  'Software': 'other',
  'Stationery': 'other',
  'Generator Diesel': 'utilities',
  'Water': 'utilities'
};

const INDIAN_BANKS = [
  'State Bank of India','HDFC Bank','ICICI Bank','Axis Bank',
  'Bank of Baroda','Kotak Mahindra Bank','Yes Bank',
  'Union Bank of India','PNB','Canara Bank','IDBI Bank',
  'Indian Bank','Bank of India','Central Bank of India'
];

let receiptCounter = {};
let idemCounter = 0;

function getReceiptNumber(year) {
  const y = year.toString().slice(2);
  if (!receiptCounter[y]) receiptCounter[y] = 0;
  receiptCounter[y]++;
  return `REC-${y}-${String(receiptCounter[y]).padStart(4, '0')}`;
}

function getGatewayRef() {
  return `ORD_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
}

function getIdempotencyKey() {
  idemCounter++;
  return `IDEM_${Date.now()}_${idemCounter}`;
}

function pickRandom(arr, idx) {
  return arr[idx % arr.length];
}

function generateMobile(index) {
  const prefixes = ['9','8','7','6'];
  const prefix = prefixes[index % prefixes.length];
  const rest = String(100000000 + index).slice(1);
  return `${prefix}${rest}`;
}

function generateEmail(name, index) {
  const sanitized = name.toLowerCase().replace(/\s+/g, '.');
  const domains = ['gmail.com','yahoo.co.in','rediffmail.com','outlook.com','gmail.com'];
  return `${sanitized}.${index}@${domains[index % domains.length]}`;
}

function generateStudentName(index, surname) {
  const isMale = index % 3 !== 2;
  const firstName = pickRandom(isMale ? MALE_NAMES : FEMALE_NAMES, index);
  return `${firstName} ${surname}`;
}

function generateGuardianName(index, surname) {
  const names = [...MALE_NAMES, ...FEMALE_NAMES];
  const firstName = names[index % names.length];
  return `${firstName} ${surname}`;
}

function randomBetween(min, max, idx) {
  return min + (idx % (max - min + 1));
}

function weightedPick(options, weights, idx) {
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  let target = 1 + (idx % totalWeight);
  for (let i = 0; i < options.length; i++) {
    target -= weights[i];
    if (target <= 0) return options[i];
  }
  return options[options.length - 1];
}

const PAYMENT_METHODS = ['UPI','CASH','CHEQUE'];
const PAYMENT_WEIGHTS = [63, 24, 13];

const TX_STATUSES = ['success','pending','failed','reversed'];
const TX_WEIGHTS = [92, 3, 2, 3];

const CHEQUE_STATUSES = ['deposit_pending','bank_pending','cleared','bounced'];
const CHEQUE_WEIGHTS = [15, 12, 68, 5];

const KYC_STATUSES = ['verified','pending','ocr_flagged','rejected','stage2_pending','admin_override'];
const KYC_WEIGHTS = [60, 15, 8, 5, 7, 5];

const SPECIFIC_AMOUNTS = [0, 1, 10, 99, 250, 499, 500, 999, 1000, 9999, 10000, 50000, 100000];

const OFFLINE_SYNC_STATUSES = ['pending', 'synced', 'failed', 'duplicate', 'conflict'];

function feeAmountForClass(className, feeType) {
  const group = CLASS_GROUPS[className];
  if (feeType === 'tuition') {
    const amounts = { primary: 18000, middle: 25000, secondary: 32000, higher: 40000 };
    const base = amounts[group] || 20000;
    return base + (CLASSES.indexOf(className) % 5) * 1000;
  }
  if (feeType === 'transport') {
    const amounts = { primary: 4000, middle: 5000, secondary: 6000, higher: 7000 };
    return amounts[group] || 4500;
  }
  if (feeType === 'late_fee') {
    return 50 + (CLASSES.indexOf(className) % 5) * 50;
  }
  if (feeType === 'other') {
    const amounts = { primary: 1500, middle: 2000, secondary: 2500, higher: 3000 };
    return amounts[group] || 1800;
  }
  return 2000;
}

module.exports = {
  faker,
  CLASSES,
  CLASS_GROUPS,
  STUDENTS_PER_CLASS,
  ALL_SURNAMES,
  GUJARATI_SURNAMES,
  HINDI_SURNAMES,
  MARATHI_SURNAMES,
  SOUTH_INDIAN_SURNAMES,
  MALE_NAMES,
  FEMALE_NAMES,
  OCCUPATIONS,
  CITIES,
  BOUNCE_REASONS,
  WAIVER_REASONS,
  PENALTY_REASONS,
  EXPENSE_CATEGORIES,
  INDIAN_BANKS,
  PAYMENT_METHODS,
  PAYMENT_WEIGHTS,
  TX_STATUSES,
  TX_WEIGHTS,
  CHEQUE_STATUSES,
  CHEQUE_WEIGHTS,
  KYC_STATUSES,
  KYC_WEIGHTS,
  SPECIFIC_AMOUNTS,
  OFFLINE_SYNC_STATUSES,
  getReceiptNumber,
  getGatewayRef,
  getIdempotencyKey,
  pickRandom,
  generateMobile,
  generateEmail,
  generateStudentName,
  generateGuardianName,
  randomBetween,
  weightedPick,
  feeAmountForClass
};
