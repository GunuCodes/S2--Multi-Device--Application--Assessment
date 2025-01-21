# HOW TO RUN THE EVENT PLANNER APPLICATION

This app was somehow way more stressful to make than the Unity game project bahahaha. All of the source code is in the public folder. The server folder serves to set up the backend servers and database.

## Prerequisites
- Node.js - Download from [nodejs.org](https://nodejs.org)
- MongoDB - Download from [mongodb.com](https://www.mongodb.com/try/download/community)

## How to Set Up

### Getting the Files

1. **Download as ZIP**:
   - Click the green "Code" button on GitHub
   - Select "Download ZIP"
   - Extract the ZIP file to your computer

2. **Clone with Git** (if you have Git installed):
   ```bash
   git clone https://github.com/GunuCodes/S2--Multi-Device--Application--Assessment
   ```

### Setting Up the Application

1. **Install Required Programs**:
   - Open a terminal/command prompt in the `server` folder
   - Run this command:
   ```bash
   npm install
   ```

2. **Set Up Configuration**:
   - Copy the file `.env.example` and rename it to `.env`
   - Open `.env` and update these settings:
     - `MONGODB_URI`: Your database connection (default should work if MongoDB is installed)
     - `JWT_SECRET`: Honestly just type anything, doesn't matter.
     - `PORT`: Leave as 5000 unless you need a different port

3. **Start the Application**:
   - Start the server:
   ```bash
   npm start
   ```
   - Start the website (in a new terminal):
   ```bash
   cd ../public
   npx serve
   ```

4. **Use the Application**:
   - Open your web browser
   - Go to: `http://localhost:3000`
   - Create an account and you can start the program.

If you run into problems:
1. Make sure MongoDB is running on properly on the terminal
2. Check that all the required programs are installed
3. Verify your `.env` file has the correct information
4. Make sure no other programs are using ports 3000 or 5000

## Environment Variables

The following environment variables need to be set in your `.env` file:

- `PORT`: The port number for the server (default: 5000)
- `MONGODB_URI`: Your MongoDB connection string
- `JWT_SECRET`: Secret key for JWT token generation

## API Endpoints

### Authentication
- POST `/api/users/register` - Register a new user
- POST `/api/users/login` - Login user
- GET `/api/users/profile` - Get user profile (protected)

### Events
- GET `/api/events` - Get all events for logged-in user
- POST `/api/events` - Create a new event
- PUT `/api/events/:id` - Update an event
- DELETE `/api/events/:id` - Delete an event
