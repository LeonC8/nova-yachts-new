import Image from 'next/image';
import Link from 'next/link';

export function Footer() {
  return (
    <footer className="bg-slate-800 text-white py-8">
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
              <li><Link href="/home" className="text-gray-300">Home</Link></li>
              <li><Link href="/new-yachts" className="text-gray-300">New Yachts</Link></li>
              <li><Link href="/pre-owned" className="text-gray-300">Pre-owned</Link></li>
              <li><a href="https://www.fairline.com" target="_blank" rel="noopener noreferrer" className="text-gray-300">Fairline</a></li>
              <li><a href="https://www.numarine.com" target="_blank" rel="noopener noreferrer" className="text-gray-300">Numarine</a></li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg  font-medium mb-4">Contact Us</h3>
            <p className="text-gray-300 text-sm mb-2">Gomboševa 28, Zagreb, Croatia</p>
            <p className="text-gray-300 text-sm mb-2">Phone: +385 98 301 987</p>
            <p className="text-gray-300 text-sm mb-2"> Email: office@novayachts.eu</p>
          </div>
        </div>
        <div className="mt-10 text-left">
          <hr className="border-gray-300 mb-6 opacity-50 w-1/4 md:w-full md:mt-20"></hr>
          <div className="flex flex-col md:flex-row md:justify-between">
            <p className="text-gray-300 text-sm mb-3 md:mb-0">&copy; 2023 NovaYachts. All rights reserved.</p>
            <Link href="/admin" className="text-gray-300 text-sm">Dealer login</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
