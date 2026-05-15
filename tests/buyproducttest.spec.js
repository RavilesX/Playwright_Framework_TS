// @ts-check
import { devices, test } from "@playwright/test";
import {LoginPage} from "../pages/LoginPage";
import {MainPage} from "../pages/MainPage";
import {CheckoutPage} from "../pages/CheckoutPage";
import {InformationPage} from "../pages/InformationPage";
import {ConfirmationPage} from "../pages/ConfirmationPage";
import {CartPage} from "../pages/CartPage";

test('buy product', async ({ browser }) => {
  //example of how to create a new context with the configuration for the mobile device
  // const context = await browser.newContext({
  //     ...devices['iPhone 14'],
  //     locale: 'es-MX',
  //     geolocation: { latitude: 21.1, longitude: -101.7 }, // León, Gto
  //     permissions: ['geolocation'],
  // });
  const context = await browser.newContext();
  const page = await context.newPage();


  await page.goto(process.env.BASE_URL);
  //initialize the page objects
  const loginPage = new LoginPage(page);
  const mainPage = new MainPage(page);
  const cartPage = new CartPage(page);
  const checkoutPage =  new CheckoutPage(page);
  const informationPage = new InformationPage(page);
  const confirmationPage = new ConfirmationPage(page);
  
  //Login to the application
  await loginPage.login(process.env.UNAME, process.env.PASSWORD);

  //Add product to the cart
  const {itemName,price} = await mainPage.SelectItem("Sauce Labs Fleece Jacket");

  //go to the cart
  await mainPage.goToCart();
  
  //confirm the product and price is the same as in the previos page
  await cartPage.verifyProducts(itemName,price);
    
  //checkout
  await cartPage.checkout();

  //Fill data in the form and continue
  await  checkoutPage.fillForm("Ricardo","Aviles","12345");

  //continue to next page
  await checkoutPage.continueToPay();

  //confirm price quantity and product name
  await informationPage.verifyProducts(itemName,price);

  //finish the order
  await informationPage.finish();

  //confirm the order is completed  
  await confirmationPage.orderConfirmation();

  //Back to the main page
  await confirmationPage.backToMainPage();

  //logout
  await mainPage.logout();

});
