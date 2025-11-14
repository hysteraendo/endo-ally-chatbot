import React from 'react';

const images = [
  { src: 'https://assets-global.website-files.com/64639744b742a259c0780447/65649dc495267eb97b97c419_Endo%20Violence%20Book_Title%20Page.png', alt: 'Title page of the book Endo Violence' },
  { src: 'https://assets-global.website-files.com/64639744b742a259c0780447/65649dc4d3b603a89e604085_Endo%20Violence%20Book_Definition.png', alt: 'Page defining Endo Violence' },
  { src: 'https://assets-global.website-files.com/64639744b742a259c0780447/65649dc5137351648a562477_Endo%20Violence%20Book_Foreword.png', alt: 'Foreword of the book Endo Violence' },
  { src: 'https://assets-global.website-files.com/64639744b742a259c0780447/65649dc484196144a49c6d17_Endo%20Violence%20Book_Contents.png', alt: 'Table of contents of the book Endo Violence' },
];

const ImageGallery: React.FC = () => {
  return (
    <div className="bg-white p-4 rounded-lg shadow-md sticky top-24">
      <h2 className="text-lg font-serif font-bold mb-4">From the Book</h2>
      <div className="grid grid-cols-2 gap-4">
        {images.map((image, index) => (
          <a href={image.src} target="_blank" rel="noopener noreferrer" key={index}>
            <img 
              src={image.src} 
              alt={image.alt} 
              className="rounded-md object-cover w-full h-32 border hover:shadow-lg transition-shadow duration-200" 
            />
          </a>
        ))}
      </div>
       <p className="text-xs text-gray-500 mt-4">Click an image to see a larger version. The chatbot may also show these images in its responses.</p>
    </div>
  );
};

export default ImageGallery;