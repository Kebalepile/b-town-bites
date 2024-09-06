# Boitekong Eats

Welcome to Boitekong Eats, your go-to web app for homemade fast food! We specialize in offering a variety of delicious homemade dishes and drinks, all available for prepaid order.

## Menu Highlights

- **Pizza**: Freshly baked with a variety of toppings to choose from.
- **Chicken Wings**: Juicy and flavorful, perfect for any occasion.
- **Chips**: Crispy and golden, a great side for any meal.
- **Magwinya**: Traditional fried dough, a tasty snack.
- **Baked Cookies (di kuku)**: Homemade cookies, perfect for satisfying your sweet tooth.
- **Homemade Drinks**: Including refreshing options like gemere.

## Features

- **Prepaid Orders**: Place and pay for your order online for a seamless experience.
- **User-Friendly Interface**: Easy navigation and a straightforward ordering process.
- **Fast and Reliable**: Get your food quickly, with a focus on quality and taste.

## How to Use

1. **Browse the Menu**: Explore our variety of homemade fast food options.
2. **Place Your Order**: Select your desired items and add them to your cart.
3. **Checkout**: Complete the payment process through our secure payment gateway.
4. **Enjoy Your Meal**: Receive your freshly prepared food at the specified time.

## Getting Started

### Prerequisites

To run Boitekong Eats locally, you'll need to have the following installed:

- [Node.js](https://nodejs.org/)
- [MongoDB](https://www.mongodb.com/)

### Installation

1. Clone the repository:
    ```sh
    git clone https://github.com/yourusername/julias-kitchen.git
    ```
2. Navigate to the project directory:
    ```sh
    cd julias-kitchen
    ```
3. Install dependencies:
    ```sh
    npm install
    ```
4. Set up environment variables:
    - Create a `.env` file in the root directory.
    - Add your MongoDB connection string and any other necessary environment variables:
        ```
        MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.phjo6o5.mongodb.net/<dbname>?retryWrites=true&w=majority
        PORT=5000
        ```

### Running the App

1. Start the development server:
    ```sh
    npm run app
    ```
2. Open your browser and go to `http://localhost:5000` to access Boitekong Eats.

## Contributing

We welcome contributions! If you'd like to contribute to Boitekong Eats, please follow these steps:

1. Fork the repository.
2. Create a new branch:
    ```sh
    git checkout -b feature/your-feature-name
    ```
3. Make your changes and commit them:
    ```sh
    git commit -m 'Add some feature'
    ```
4. Push to the branch:
    ```sh
    git push origin feature/your-feature-name
    ```
5. Open a pull request.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for more details.
