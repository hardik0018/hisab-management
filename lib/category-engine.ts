export const EXPENSE_CATEGORIES = [
  'Groceries & Kitchen',
  'Vegetables & Fruits',
  'Fuel, Vehicle & Travel',
  'Snacks, Food & Dining',
  'Bills, Rent & Housing',
  'Investments & Insurance',
  'Salary & Income',
  'Personal Care & Medical',
  'Shopping & Stores',
  'Education & Stationery',
  'Gifts & Marriage',
  'Transfers & Settlements',
  'General & Other',
] as const;

export type ExpenseCategory = typeof EXPENSE_CATEGORIES[number];

/**
 * Dynamically evaluates item name, note, amount, and transaction type against customized
 * regex patterns to automatically assign the most accurate expense category.
 *
 * Supports English, Hindi transliteration, and Gujarati transliteration (Roman script).
 *
 * @param itemName The title/item name of the expense.
 * @param note Optional note or description accompanying the expense.
 * @param amount Optional numerical amount of the transaction.
 * @param type Optional transaction type ('expense', 'income', 'transfer_in', 'transfer_out', etc.).
 * @param currentCategory Optional existing category. If already a valid specific category, it is preserved.
 * @returns The assigned category string.
 */
export function categorizeExpense(
  itemName: string,
  note?: string,
  amount?: number,
  type?: string,
  currentCategory?: string
): string {
  // If a specific, meaningful category is already assigned, preserve it
  if (
    currentCategory &&
    currentCategory.trim() !== '' &&
    currentCategory !== 'Uncategorized' &&
    currentCategory !== 'other' &&
    currentCategory !== 'General & Other'
  ) {
    return currentCategory.trim();
  }

  // Handle explicit transaction types first
  if (type === 'transfer_in' || type === 'transfer_out' || type === 'transfer') {
    return 'Transfers & Settlements';
  }

  const text = `${itemName} ${note || ''}`.toLowerCase().trim();

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. Investments, Insurance & Savings (રોકાણ અને વીમો)
  // ─────────────────────────────────────────────────────────────────────────────
  if (/\bsip\b|lic|insurance|premium|policy|invest|mutual\s*fund|\bshare\b|\bshares\b|\bstock\b|\bstocks\b|\bgold\b|nifty|sensex|\bppf\b|\bepf\b|\bnps\b|\belss\b|\bfd\b|fixed\s*deposit|recurring\s*deposit|\brd\b|demat|trading|\bsilver\b|chandi|zaveri|\bjewel\b|jewellery|jewelry|diamond|heera/i.test(text)) {
    return 'Investments & Insurance';
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. Salary & Income (આવક અને પગાર)
  // ─────────────────────────────────────────────────────────────────────────────
  if (/salary|bonus|stipend|income|wage|synergy|prime|trion|overtime|over\s*time|pagar|pagaar|commission|freelance|dividend|cashback|\brefund\b|interest/i.test(text) || type === 'income') {
    return 'Salary & Income';
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. Education & Stationery (શિક્ષણ અને સ્ટેશનરી)
  if (/msc|bsc|mba|bca|mca|bba|\bba\b|\bma\b|\bca\b|\bcs\b|\bsem\d*\b|semester|college|school|university|\bfee\b|fees|tuition|tution|\bexam\b|examination|\bbook\b|books\b|notebook|\bcopy\b|\bpen\b|pencil|eraser|sharpener|scale|ruler|geometry|compass|xerox|photocopy|stationery|stationary|\bprint\b|printing|coaching|\bclass\b|classes|lecture|study|padai|abhyas|degree|diploma|certificate|admission|hostel|library|\blab\b|laboratory|assignment|uniform|school\s*bag|school\s*fee|college\s*fee|course|online\s*course|udemy|coursera/i.test(text)) {
    if (!/gas\s*fees|gas\s*bill|\bgas\b/i.test(text)) {
      return 'Education & Stationery';
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 4. Fuel, Vehicle & Travel (વાહન અને મુસાફરી)
  // ─────────────────────────────────────────────────────────────────────────────
  if (/petrol|diesel|fuel|\bbike\b|servic|motorcycle|scooter|activa|cycle|\bcar\b|train|tren|\bbus\b|ticket|repido|rapido|echo|riksha|rickshaw|\bauto\b|taxi|travel|conductor|\bcab\b|uber|ola|flight|airplane|airport|toll|parking|vehicle|gaadi|gadi|motor|tyre|tire|puncture|engine|oil\s*change|battery|spare|number\s*plate|rto|rc\s*book|vahan|yatra|musafari|railway|metro|monorail|highway|expressway|ferry|boat|ship/i.test(text)) {
    return 'Fuel, Vehicle & Travel';
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 5. Snacks, Food & Dining (નાસ્તો અને જમવાનું) - Checked before raw vegetables
  // ─────────────────────────────────────────────────────────────────────────────
  if (/nasto|naasto|\bsnack\b|snacks|gathiya|bhungra|bungra|vefar|wafer|biscuit|\bpuf\b|\bpaf\b|puff|gulfi|kulfi|panipuri|pani\s*puri|pavbhaji|pav\s*bhaji|megi|maggi|puri\s*shak|chocolate|choco|\bcha\b|\bchai\b|\btea\b|\bcoffee\b|chips|hotel|restaurant|\bfood\b|pizza|burger|chevdo|chivda|\bsoda\b|juice|lassi|milkshake|shake|icecream|ice\s*cream|mithai|mithoi|sweet|ladoo|barfi|halwa|kheer|shrikhand|basundi|rabdi|falooda|dosa|idli|sambhar|vada|medu|upma|dalvada|bhajiya|pakora|pakoda|samosa|kachori|dhokla|khaman|khandvi|thepla|rotla|bajra|bhakri|\broti\b|chapati|paratha|\bpuri\b|khichdi|biriyani|biryani|pulao|fried\s*rice|hakka|noodle|manchurian|tiffin|lunch|dinner|breakfast|jaman|khaanu|khana|dabeli|vada\s*pav|misal|\bpav\b|bhel|sev\s*puri|ragda|dahi\s*puri|puchka|gola|sugarcane\s*juice|coconut\s*water|chaas|aam\s*panna|sharbat|nimbu\s*pani|lemonade|cold\s*drink|pepsi|cola|sprite|thums\s*up|limca|maaza|frooti|appy|bakery|bread|toast|cake|muffin|cupcake|cookie|rusk|khari|\bbun\b|jeera\s*biscuit|mathri|namak\s*para|sev\s*mamra|murukku|chakli|fafda|namkeen|farsan/i.test(text)) {
    return 'Snacks, Food & Dining';
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 6. Personal Care, Health & Medical (આરોગ્ય અને પર્સનલ કેર)
  // ─────────────────────────────────────────────────────────────────────────────
  if (/hair|haircut|hairkut|salon|parlour|parlor|barber|nai|doctor|\bdr\b|hospital|medicine|medical|pharma|pharmacy|chemist|pill|tablet|capsule|syrup|clinic|\btest\b|blood\s*test|urine|x\s*ray|xray|scan|mri|sonography|ultrasound|ecg|dental|dentist|tooth|teeth|\beye\b|optic|jilaid|gillette|\bgard\b|guard|shave|razor|blade|chasma|glasses|specs|spectacles|goggle|sunglasses|dava|dawa|dawai|injection|vaccine|band\s*aid|bandage|ointment|moisturizer|sunscreen|deodorant|\bdeo\b|perfume|attar|ittar|\bnail\b|manicure|pedicure|waxing|threading|facial|bleach|henna|mehendi|colgate|toothpaste|toothbrush|manjan|sampoo|sempu|shampoo|conditioner|\bped\b|\bpad\b|napkin|tampon|diaper|pampers|baby\s*oil|baby\s*powder|baby\s*soap|talcum|ayurvedic|homeopathic|gym|fitness|yoga|meditation|supplement|vitamin|calcium|physiotherapy|ambulance|nursing|compounder|spectacle|frame|\blens\b|contact\s*lens|hearing\s*aid/i.test(text)) {
    return 'Personal Care & Medical';
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 7. Bills, Rent & Housing (બિલ, ભાડું અને ઘર)
  // ─────────────────────────────────────────────────────────────────────────────
  if (/recharge|mobile|wifi|broadband|internet|light\s*bill|electricity|bijli|electric|gas\s*bill|\bgas\b|bhadu|\brent\b|\broom\b|makan|home|house|repair|blender|regulalater|regulator|fevicik|fevistik|fevi|\block\b|chipiya|makoda|pest|chowk|plastic|khapad|kapda|katko|duster|cleaning|\batm\b|charge|\btax\b|gst|potu|jhadu|jhaadu|broom|mop|phenyl|fynol|harpic|collin|colin|\bvim\b|\brin\b|detergent|\bsabun\b|\bsaboo\b|vaasan|bucket|dabdu|\btub\b|\bpipe\b|\bnal\b|nali|plumber|plumbing|electrician|painter|paint|\bwall\b|ceiling|\bfloor\b|tile|cement|sand|brick|\brod\b|hardware|curtain|parda|sofa|chair|\btable\b|\bbed\b|mattress|gaddo|goddo|almirah|almari|wardrobe|fridge|refrigerator|\btv\b|television|washing\s*machine|\bac\b|air\s*condition|cooler|\bfan\b|bulb|tube\s*light|\bled\b|switch|wire|plug|socket|maintenance|society|society\s*bill|water\s*bill|water\s*tax|dpc|property\s*tax|municipal|nagar\s*palika|subscription|netflix|hotstar|amazon\s*prime|youtube|spotify|canteen|mess/i.test(text)) {
    return 'Bills, Rent & Housing';
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 8. Vegetables & Fruits (શાકભાજી અને ફળ)
  // ─────────────────────────────────────────────────────────────────────────────
  if (/tameta|tamato|tomato|bateka|bataka|\baloo\b|potato|rigna|ringna|rigana|rigan|brinjal|eggplant|marcha|march|mirchi|chilli|karela|bitter\s*gourd|bhindo|bhindi|okra|kakdi|kakani|cucumber|gavar|cluster\s*bean|dudhi|lauki|bottle\s*gourd|kobi|kobij|cabbage|vatana|peas|keri|kairi|mango|kela|kera|banana|kachi\s*keri|sherdi|sugarcane|khalela|\bpeel\b|fulavar|fulavr|cauliflower|bakalu|papdi|valor|methi\s*bhaji|\bmethi\b|palak|spinach|dadam|pomegranate|draksh|grape|angoor|apple|\bseb\b|orange|mosambi|lemon|limbu|nimbu|papaya|papita|guava|jamfal|jamboo|berry|strawberry|pineapple|ananas|watermelon|tarbooj|tarbuj|muskmelon|kharbooj|chiku|sapota|sitafal|sharifa|jamun|litchi|kiwi|pumpkin|kohlu|kaddu|tinda|tindola|galka|turiya|saragvo|drumstick|beet|chukandar|radish|mulo|mooli|suran|yam|arbi|kachalu|green\s*bean|fansi|\bsem\b|sem\s*phali|lila\s*marcha|capsicum|shimla\s*mirchi|corn|makai|bhutta|raw\s*banana|raw\s*papaya|vegetable|vegetables|sabji|\bshak\b|\bfruit\b|fruits/i.test(text)) {
    return 'Vegetables & Fruits';
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 9. Groceries & Kitchen (કરિયાણું અને રસોડું)
  // ─────────────────────────────────────────────────────────────────────────────
  if (/dudh|milk|dahi|curd|yogurt|dhana|jisoda|jeeshoda|pawa|pava|samo|sabudana|sabu\b|sabudani|sing|singdana|peanut|groundnut|ajwain|carom|jeera|cumin|turmeric|haldi|dhana\s*jeera|rai|mustard|sugar|khand|solt|salt|mithu|rava|semolina|kathor|mag|moong|hing|asafoetida|mamra|mamara|murmura|puffed\s*rice|astar|bakas|baking|shree\s*fal|shreefal|nariyel|coconut|powder|khapda\s*dhovano|liquid|vasan|rooh|durvana|sori|chhash|chhaash|buttermilk|navratra|orsolum|\boil\b|tel|\btail\b|agarbatti|incense|ghau|ઘઉં|wheat|kirana|kariyanu|grocery|masala|spice|\bsev\b|chavanu|papad|\blot\b|aato|flour|chana|gram|\bmoti\b|\bdal\b|toor|tuvar|urad|udad|moong\s*dal|chana\s*dal|masoor|masur|rajma|kidney|soya|ghee|butter|makhan|cream\b|paneer|cheese|badam|almond|cashew|kaju|pista|pistachio|walnut|akhrot|raisin|kismis|dry\s*fruit|sukho\s*mevo|mevo|khajoor|\bdate\b|anjeer|fig|cardamom|elaichi|cinnamon|taj|clove|lavang|pepper|mari|saffron|kesar|bay\s*leaf|tej\s*patta|star\s*anise|chakri\s*phool|nutmeg|jayfal|sesame|tal|tali|linseed|alsi|poppy|khas\s*khas|makhana|fox\s*nut|cornflour|maida|suji|besan|gram\s*flour|rice|chawal|chokha|poha|beaten\s*rice|jaggery|\bgol\b|gurr|\bgud\b|honey|shahad|vinegar|sirko|soya\s*sauce|ketchup|\bsauce\b|chutney|achaar|pickle|\bjam\b|squash|concentrate|noodles|pasta|vermicelli|sevai|khakhara|tea\s*powder|chai\s*patti|coffee\s*powder|horlicks|bournvita|complan|protein|health\s*drink|mineral\s*water|\bbottle\b/i.test(text)) {
    return 'Groceries & Kitchen';
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 10. Shopping & Stores (શોપિંગ અને ખરીદી)
  // ─────────────────────────────────────────────────────────────────────────────
  if (/dress|cloth|saree|saadi|sari|salwar|kurta|kurti|lehenga|dupatta|chunni|shirt|pant|jeans|trouser|shorts|skirt|tshirt|t-shirt|jacket|sweater|hoodie|coat|suit|sherwani|dhoti|pajama|pyjama|nighty|gown|blouse|bra|chaddi|lingerie|shoes|chappal|champal|sandal|mojadi|slipper|boot|sneaker|sports\s*shoe|laptop|mobile\s*phone|smartphone|ipad|computer|desktop|printer|electronics|headphone|earphone|speaker|charger|cable|adapter|powerbank|power\s*bank|smartwatch|camera|tripod|d\s*mart|dmart|reliance|big\s*bazaar|bigbazaar|shopping|\bbag\b|purse|wallet|belt|\bwatch\b|whatch|jewellery|jewelry|\bring\b|bangle|kada|necklace|chain|earring|bracelet|rotary|museum|mall|store|showroom|underwear|innerwear|butti|butii|unn|rumal|moja|dabo|handbag|clutch|backpack|suitcase|luggage|umbrella|chhatro|toy|game|doll|puzzle|cricket|\bbat\b|\bball\b|sports|gym\s*equipment|bicycle|kitchen\s*utensil|vessel|vasan|tapeli|tava|kadhai|cooker|pressure\s*cooker|\bpan\b|bowl|plate|spoon|fork|knife|chopper|juicer|mixer|grinder|iron\s*box|furniture|decoration|diya|\blamp\b|candle|flower\s*pot|garden/i.test(text)) {
    return 'Shopping & Stores';
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 11. Gifts, Marriage & Social (ભેટ, લગ્ન અને વ્યવહાર)
  // ─────────────────────────────────────────────────────────────────────────────
  if (/gift|vyahar|vyavhar|marriage|lagn|lagna|chandlo|shadi|vivah|wedding|\bdan\b|daan|bhet|rohit|friend|kotharo|papal|birthday|bday|anniversary|party|celebration|festival|diwali|navratri|holi|rakhi|eid|christmas|new\s*year|donation|charity|temple|mandir|dargah|church|pooja|puja|religious|dharmic|prasad|tilak|sagpan|engagement|sagai|ring\s*ceremony|baby\s*shower|mundan|janamdin|condolence|funeral|death|uthamna|teras|pagdi|shraddha/i.test(text)) {
    return 'Gifts & Marriage';
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 12. Transfers & Balance Settlements (ટ્રાન્સફર અને હિસાબ)
  // ─────────────────────────────────────────────────────────────────────────────
  if (/transfer|net\s*balance|balance|credit|debit|hisab|jama|udhar|settle|settlement|aayavar|pravinbhai|dhayrana|daurana|dado|demo|loan|borrow|lend|mahesh\s*kaka|nin|paisa\s*aapya|paisa\s*lidha|bharpai|repay|payment|udhaar|advance|deposit/i.test(text)) {
    return 'Transfers & Settlements';
  }

  // Default fallback
  return 'General & Other';
}
