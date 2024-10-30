import Image from 'next/image';

export function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-8">
      <div className="container mx-auto px-4 xl:px-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <Image
              src="https://res.cloudinary.com/dsgx9xiva/image/upload/v1729932049/nova-yachts/logo/nova-yachts_wrtrr2_fkh4xk.png"
              alt="NovaYachts Logo"
              width={150}
              height={30}
              className="mb-6 h-10 w-auto ml-0"
            />
            <p className='text-gray-300 text-sm italic'>Since 1994</p>
          </div>
          <div>
            <h3 className="text-lg  font-medium mb-4">Quick Links</h3>  
            <ul className="space-y-2 text-sm">
              <li><a href="/home" className="text-gray-300">Home</a></li>
              <li><a href="/new-yachts" className="text-gray-300">New Yachts</a></li>
              <li><a href="/pre-owned" className="text-gray-300">Pre-owned</a></li>
              <li><a href="https://www.fairline.com" target="_blank" rel="noopener noreferrer" className="text-gray-300">Fairline</a></li>
              <li><a href="https://www.numarine.com" target="_blank" rel="noopener noreferrer" className="text-gray-300">Numarine</a></li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg  font-medium mb-4">Contact Us</h3>
            <p className="text-gray-300 text-sm mb-2">Hribarov Prilaz 10, Zagreb, Croatia</p>
            <p className="text-gray-300 text-sm mb-2">Phone: +385 95 521 6033</p>
            <p className="text-gray-300 text-sm mb-2"> Email: office@novayachts.eu</p>
          </div>
        </div>
        <div className="mt-10 text-left">
          <hr className="border-gray-300 mb-6 opacity-50 w-1/4 md:w-full md:mt-20"></hr>
          <p className="text-gray-300 text-sm">&copy; 2023 NovaYachts. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
