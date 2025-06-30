import parkingImage from '../images/image.png';
import { Link } from 'react-router-dom';

const Home = () => {
    return (
        <div className="h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-900 to-blue-600">
            <div className="max-w-4xl mx-auto text-center px-4">
                <img src={parkingImage} alt="Parking Lot" className="w-full h-64 object-cover rounded-lg shadow-2xl mb-8" />
                <h1 className="text-5xl font-bold text-white mb-4">Welcome to Parking System</h1>
                <p className="text-xl text-blue-100 mb-8">A convenient and easy way to manage your parking slots</p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link 
                        to="/login" 
                        className="bg-white hover:bg-gray-100 text-blue-600 font-bold py-3 px-8 rounded-lg shadow-lg transition duration-300 transform hover:scale-105"
                    >
                        Login
                    </Link>
                    <Link 
                        to="/register" 
                        className="bg-blue-500 hover:bg-blue-400 text-white font-bold py-3 px-8 rounded-lg shadow-lg transition duration-300 transform hover:scale-105"
                    >
                        Register
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default Home;
