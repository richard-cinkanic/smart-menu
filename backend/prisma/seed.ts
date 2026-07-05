import { CustomerRole, PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/utils/auth.js";
import { generateTableQrCode } from "../src/services/qrCodeService.js";

const prisma = new PrismaClient();

type SeedProduct = {
  name: string;
  description: string;
  price: number;
  imageUrl: string;
};

type SeedCategory = {
  name: string;
  products: SeedProduct[];
};

const image = (query: string) => `https://source.unsplash.com/900x700/?${encodeURIComponent(query)}`;

const menu: SeedCategory[] = [
  {
    name: "Káva",
    products: [
      { name: "Espresso", description: "Krátka intenzívna káva s hustou cremou, pripravená z čerstvo mletých zŕn.", price: 2.2, imageUrl: image("espresso coffee cup") },
      { name: "Double Espresso", description: "Dvojitá dávka espressa pre výraznejšiu chuť a extra energiu počas dňa.", price: 3.2, imageUrl: image("double espresso coffee") },
      { name: "Americano", description: "Espresso predĺžené horúcou vodou, jemnejšie na chuť a vhodné na pomalé popíjanie.", price: 2.8, imageUrl: image("americano coffee") },
      { name: "Cappuccino", description: "Vyvážené espresso s teplým mliekom a nadýchanou mliečnou penou.", price: 3.4, imageUrl: image("cappuccino coffee foam") },
      { name: "Latte", description: "Jemná mliečna káva s espressom a krémovou penou, ideálna k dezertu.", price: 3.8, imageUrl: image("latte coffee") },
      { name: "Flat White", description: "Silnejšia káva s dvojitým espressom a zamatovo napeneným mliekom.", price: 4, imageUrl: image("flat white coffee") },
      { name: "Ľadová káva", description: "Osviežujúca studená káva s mliekom, ľadom a jemne sladkým tónom.", price: 4.5, imageUrl: image("iced coffee glass") }
    ]
  },
  {
    name: "Čaje",
    products: [
      { name: "Mätový čaj", description: "Voňavý mätový čaj s prirodzene sviežou chuťou, vhodný po jedle.", price: 2.8, imageUrl: image("mint tea") },
      { name: "Zelený čaj", description: "Ľahký zelený čaj s jemne trávnatým profilom a čistým záverom.", price: 2.8, imageUrl: image("green tea") },
      { name: "Ovocný čaj", description: "Aromatická ovocná zmes s tónmi lesného ovocia a príjemnou sladkosťou.", price: 2.8, imageUrl: image("fruit tea") },
      { name: "Zázvorový čaj", description: "Hrejivý zázvorový čaj s citrónom, vhodný na chladnejšie večery.", price: 3.2, imageUrl: image("ginger tea lemon") }
    ]
  },
  {
    name: "Nealkoholické nápoje",
    products: [
      { name: "Coca-Cola", description: "Klasický sýtený kolový nápoj podávaný dobre vychladený.", price: 2.9, imageUrl: image("cola glass ice") },
      { name: "Coca-Cola Zero", description: "Kolový nápoj bez cukru s osviežujúcou chuťou a ľadom.", price: 2.9, imageUrl: image("cola zero glass") },
      { name: "Fanta", description: "Sýtený pomarančový nápoj s ovocnou arómou a sviežim záverom.", price: 2.9, imageUrl: image("orange soda glass") },
      { name: "Sprite", description: "Citrónovo-limetkový sýtený nápoj, ľahký a výrazne osviežujúci.", price: 2.9, imageUrl: image("lemon lime soda") },
      { name: "Tonic", description: "Perlivý tonic s jemne horkou chuťou, vhodný samostatne aj k miešaným nápojom.", price: 2.9, imageUrl: image("tonic water glass") },
      { name: "Minerálna voda", description: "Chladená minerálna voda na osvieženie počas celého dňa.", price: 2.2, imageUrl: image("mineral water glass") },
      { name: "Fresh Pomaranč", description: "Čerstvo lisovaná pomarančová šťava s plnou citrusovou chuťou.", price: 4.5, imageUrl: image("fresh orange juice") },
      { name: "Domáca limonáda", description: "Domáca limonáda s citrónom, mätou a ľadom, pripravená priamo na bare.", price: 4.9, imageUrl: image("homemade lemonade mint") }
    ]
  },
  {
    name: "Nealkoholické miešané nápoje",
    products: [
      { name: "Virgin Mojito", description: "Nealko mojito s limetkou, mätou, trstinovým cukrom a sódou.", price: 5.5, imageUrl: image("virgin mojito") },
      { name: "Virgin Piña Colada", description: "Krémový ananásovo-kokosový nápoj bez alkoholu s tropickou chuťou.", price: 5.9, imageUrl: image("virgin pina colada") },
      { name: "Virgin Sex on the Beach", description: "Ovocný nealko koktail s pomarančom, broskyňou a brusnicovým tónom.", price: 5.9, imageUrl: image("fruit mocktail") },
      { name: "Blue Lagoon Zero", description: "Svieži modrý mocktail s citrusovou chuťou a ľadom.", price: 5.5, imageUrl: image("blue lagoon mocktail") },
      { name: "Shirley Temple", description: "Sladký nealko drink so zázvorovou limonádou, grenadínou a čerešňou.", price: 4.9, imageUrl: image("shirley temple mocktail") },
      { name: "Tropical Sunset", description: "Tropický miešaný nápoj s ananásom, mangom a jemným citrusom.", price: 5.9, imageUrl: image("tropical sunset mocktail") },
      { name: "Fresh Lemonade", description: "Citrónová limonáda s čerstvou šťavou, ľadom a jemnou sladkosťou.", price: 4.5, imageUrl: image("fresh lemonade") },
      { name: "Strawberry Lemonade", description: "Jahodová limonáda s ovocným pyré, citrónom a mätou.", price: 4.9, imageUrl: image("strawberry lemonade") },
      { name: "Mango Lemonade", description: "Mango limonáda s tropickou vôňou a príjemne sladkým záverom.", price: 5.2, imageUrl: image("mango lemonade") },
      { name: "Cucumber Mint Cooler", description: "Uhorkovo-mätový cooler s limetkou, sódou a veľkou dávkou ľadu.", price: 5.5, imageUrl: image("cucumber mint cooler") }
    ]
  },
  {
    name: "Pivo",
    products: [
      { name: "Pilsner 0.5l", description: "Svetlý ležiak s výraznou chmeľovou horkosťou a čistou penou.", price: 3.8, imageUrl: image("pilsner beer glass") },
      { name: "Radler 0.5l", description: "Ľahký pivný radler s citrusovou sviežosťou a nižšou horkosťou.", price: 3.5, imageUrl: image("radler beer") },
      { name: "Nealko pivo", description: "Nealkoholické pivo s osviežujúcou chuťou a plným pivným charakterom.", price: 3.2, imageUrl: image("non alcoholic beer") }
    ]
  },
  {
    name: "Víno",
    products: [
      { name: "Biele víno 0.15l", description: "Ľahké biele víno s ovocnou arómou a sviežou kyselinkou.", price: 3.9, imageUrl: image("white wine glass") },
      { name: "Červené víno 0.15l", description: "Plnšie červené víno s tónmi tmavého ovocia a jemným tanínom.", price: 3.9, imageUrl: image("red wine glass") },
      { name: "Rosé 0.15l", description: "Svieže ružové víno s ovocným profilom, ideálne na letné večery.", price: 4.2, imageUrl: image("rose wine glass") },
      { name: "Prosecco 0.15l", description: "Perlivé prosecco s jemnými bublinkami, citrusom a ľahkou sladkosťou.", price: 4.5, imageUrl: image("prosecco glass") }
    ]
  },
  {
    name: "Miešané nápoje",
    products: [
      { name: "Mojito", description: "Kubánsky koktail s rumom, limetkou, mätou, trstinovým cukrom a sódou.", price: 7.9, imageUrl: image("mojito cocktail") },
      { name: "Aperol Spritz", description: "Ľahký aperitív s Aperolom, proseccom, sódou a plátkom pomaranča.", price: 6.9, imageUrl: image("aperol spritz") },
      { name: "Gin Tonic", description: "Klasický drink s ginom, tonicom, ľadom a citrusovou ozdobou.", price: 6.5, imageUrl: image("gin tonic cocktail") },
      { name: "Cuba Libre", description: "Rumový koktail s colou, limetkou a ľadom, svieži a výrazný.", price: 6.9, imageUrl: image("cuba libre cocktail") },
      { name: "Piña Colada", description: "Tropický koktail s rumom, kokosom, ananásom a krémovou textúrou.", price: 8.5, imageUrl: image("pina colada cocktail") },
      { name: "Sex on the Beach", description: "Ovocný koktail s vodkou, broskyňou, pomarančom a brusnicou.", price: 8.5, imageUrl: image("sex on the beach cocktail") },
      { name: "Tequila Sunrise", description: "Farebný koktail s tequilou, pomarančovou šťavou a grenadínou.", price: 7.9, imageUrl: image("tequila sunrise cocktail") },
      { name: "Blue Lagoon", description: "Citrusový modrý koktail s vodkou, blue curaçao a limonádou.", price: 7.5, imageUrl: image("blue lagoon cocktail") }
    ]
  },
  {
    name: "Dezerty",
    products: [
      { name: "Cheesecake", description: "Krémový cheesecake s maslovým korpusom a ovocným toppingom.", price: 4.9, imageUrl: image("cheesecake slice") },
      { name: "Brownie", description: "Čokoládové brownie s vláčnym stredom a intenzívnou kakaovou chuťou.", price: 4.5, imageUrl: image("chocolate brownie") },
      { name: "Tiramisu", description: "Taliansky dezert s mascarpone, kávou, piškótami a kakaom.", price: 5.2, imageUrl: image("tiramisu dessert") },
      { name: "Jablkový koláč", description: "Domáci jablkový koláč so škoricou a jemne chrumkavým cestom.", price: 3.9, imageUrl: image("apple pie slice") },
      { name: "Panna Cotta", description: "Jemná smotanová panna cotta s ovocnou omáčkou a vanilkou.", price: 4.9, imageUrl: image("panna cotta dessert") }
    ]
  }
];

const legacyCategoryRenames = new Map([
  ["Breakfast", "Raňajky"],
  ["Lunch", "Obed"],
  ["Drinks", "Nápoje"]
]);

const activeCategoryNames = menu.map((category) => category.name);

async function upsertProduct(categoryId: string, product: SeedProduct) {
  const existing = await prisma.product.findFirst({ where: { name: product.name, categoryId } });

  if (existing) {
    return prisma.product.update({
      where: { id: existing.id },
      data: { ...product, available: true }
    });
  }

  return prisma.product.create({
    data: { ...product, available: true, categoryId }
  });
}

async function main() {
  const restaurant = await prisma.restaurant.upsert({
    where: { id: "00000000-0000-4000-8000-000000000001" },
    update: { name: "Passé cafe bar", address: " Mostová 1356/22, 034 01 Ružomberok" },
    create: {
      id: "00000000-0000-4000-8000-000000000001",
      name: "Passé cafe bar",
      address: " Mostová 1356/22, 034 01 Ružomberok"
    }
  });

  for (const [oldName, newName] of legacyCategoryRenames) {
    const existingNewCategory = await prisma.category.findUnique({
      where: { restaurantId_name: { restaurantId: restaurant.id, name: newName } }
    });

    if (!existingNewCategory) {
      await prisma.category.updateMany({
        where: { restaurantId: restaurant.id, name: oldName },
        data: { name: newName }
      });
    }
  }

  await prisma.product.updateMany({
    where: { category: { restaurantId: restaurant.id } },
    data: { available: false }
  });

  for (const categorySeed of menu) {
    const category = await prisma.category.upsert({
      where: { restaurantId_name: { restaurantId: restaurant.id, name: categorySeed.name } },
      update: {},
      create: { name: categorySeed.name, restaurantId: restaurant.id }
    });

    for (const product of categorySeed.products) {
      await upsertProduct(category.id, product);
    }
  }

  await prisma.product.deleteMany({
    where: {
      category: {
        restaurantId: restaurant.id,
        name: { notIn: activeCategoryNames }
      },
      orderItems: { none: {} }
    }
  });

  await prisma.category.deleteMany({
    where: {
      restaurantId: restaurant.id,
      name: { notIn: activeCategoryNames },
      products: { none: {} }
    }
  });

  for (const number of [1, 2, 3, 4, 5, 6, 7]) {
    const table = await prisma.table.upsert({
      where: { restaurantId_number: { restaurantId: restaurant.id, number } },
      update: {},
      create: { number, restaurantId: restaurant.id, qrCode: "generating" }
    });
    await prisma.table.update({ where: { id: table.id }, data: { qrCode: await generateTableQrCode(number) } });
  }

  await prisma.customer.upsert({
    where: { email: "admin@smartmenu.ai" },
    update: { passwordHash: await hashPassword("admin123"), role: CustomerRole.ADMIN },
    create: { email: "admin@smartmenu.ai", passwordHash: await hashPassword("admin123"), role: CustomerRole.ADMIN }
  });
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
