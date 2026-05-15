// @ts-check
import { test } from "@playwright/test";
import {LoginPage} from "../pages/LoginPage";
import {MainPage} from "../pages/MainPage";
import {CheckoutPage} from "../pages/CheckoutPage";
import {InformationPage} from "../pages/InformationPage";
import {ConfirmationPage} from "../pages/ConfirmationPage";
import {CartPage} from "../pages/CartPage";

test('buy product', async ({ page }) => {
  await page.goto('https://www.saucedemo.com/');
  //initialize the page objects
  const loginPage = new LoginPage(page);
  const mainPage = new MainPage(page);
  const cartPage = new CartPage(page);
  const checkoutPage =  new CheckoutPage(page);
  const informationPage = new InformationPage(page);
  const confirmationPage = new ConfirmationPage(page);
  
  //Login to the application
  await loginPage.login('standard_user','secret_sauce');

  //confirm we are on the products page  
  await mainPage.verifyHeaderTitle();

  //Add product Sauce Labs Fleece Jacket to the cart
  const {itemName,price} = await mainPage.SelectItem("Sauce Labs Fleece Jacket");

  //go to the cart
  await mainPage.goToCart();

  //confirm we are in the cart page by checking the title  
  await cartPage.verifyTitle();
  
  //confirm the product and price is the same as in the previos page
  await cartPage.verifyProducts(itemName,price);
    
  //checkout
  await cartPage.checkout();

  //Confirm we are in the next page by checking the title  
  await checkoutPage.verifyTitle();

  //Fill data in the form and continue
  await  checkoutPage.fillForm("Ricardo","Aviles","12345");

  //continue to next page
  await checkoutPage.continueToPay();

  //confirm we are in the next page by checking the title  
  await informationPage.verifyTitle();

  //confirm price quantity and product name
  await informationPage.verifyProducts(itemName,price);

  //finish the order
  await informationPage.finish();

  //confirm the order is completed  
  await confirmationPage.orderConfirmation();

  //Back to the main page
  await confirmationPage.backToMainPage();

  //confirm we are on the main page
  await mainPage.verifyHeaderTitle();

  //logout
  await mainPage.logout();





});
