import React, { useState, useEffect } from 'react';
import AWS from 'aws-sdk';
import ImageGallery from 'react-image-gallery';
import 'react-image-gallery/styles/css/image-gallery.css';
import './ImageUploader.css'

// Configure AWS S3 object
AWS.config.update({
  accessKeyId: "AKIAZLVHKEBKZAJGVVHP",
  secretAccessKey: "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",
  region: "eu-west-2",
  signatureVersion: "v4",  
});
const s3 = new AWS.S3();


// Define ImageUploader component
function ImageUploader() {
  const [images, setImages] = useState([]);
  const [currentImage, setCurrentImage] = useState(null);


// Fetch images from S3 bucket using useEffect hook
  useEffect(() => {
    fetchImages();
  }, []);

// Set the current image to the first image in the images array
  useEffect(() => {
    if (images.length > 0) {
      setCurrentImage(images[0]);
    }
  }, [images]);


 // Fetch images from S3 bucket and update the images state  
  const fetchImages = async () => {
    try {
      const data = await s3.listObjectsV2({
        Bucket: 'smartcylinders',
      }).promise();
  
      const images = data.Contents.filter(item => {
        const extensions = ['.jpeg', '.png', '.gif']; // Filter images by extension
        const ext = item.Key.substr(item.Key.lastIndexOf('.')).toLowerCase();
        return extensions.includes(ext);
      }).map((item) => { // Map image data to required format for react-image-gallery
        return {
          original: `https://smartcylinders.s3.eu-west-2.amazonaws.com/${item.Key}`,
          thumbnail: `https://smartcylinders.s3.eu-west-2.amazonaws.com/${item.Key}`,
          originalTitle: item.Key,
          originalAlt: item.Key,
          key: item.Key
        };
      });
      setImages(images); // Update images state with fetched images
    } catch (err) {
      console.log(err); 
    }
  };
  
// Event handler for uploading images to S3 bucket
  const handleUploadClick = async (event) => {
    event.preventDefault();
    const fileInput = document.createElement("input"); // Create file input element
    fileInput.type = "file";
    fileInput.accept = "image/*";
    fileInput.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file.type.startsWith('image/')) { // Validate that selected file is an image
        alert('Please upload only image files');
        return;
      }
      let newImages = [];

      if (images.length > 0) { // Copy the existing images state
        newImages = [...images];
      }
      const params = {
        Bucket: 'smartcylinders',
        Key: `${Date.now()}.${file.name}`, // Generate unique file name using timestamp
        Body: file
      };
      try {
        await s3.upload(params).promise(); // Upload the image file to S3 bucket
        newImages.push({
          original: `https://smartcylinders.s3.eu-west-2.amazonaws.com/${params.Key}`,
          thumbnail: `https://smartcylinders.s3.eu-west-2.amazonaws.com/${params.Key}`,
          originalTitle: params.Key,
          originalAlt: params.Key,
          key: params.Key
        });
        setImages(newImages);
      } catch (err) {
        console.log(err);
      }
    };
    fileInput.click();
  };

  // Event handler for deleting images from S3 bucket
  const handleDelete = async (image) => {
   // Create an object with the parameters for the S3 deleteObject API
    const params = {
      Bucket: 'smartcylinders',
      Key: image.key
    };
    try {
      // Call the S3 deleteObject API to delete the image from the bucket
      await s3.deleteObject(params).promise();
      // Create a new array of images that excludes the deleted image
      const newImages = images.filter((item) => item.key !== image.key);
      // Update the images state with the new array of images
      setImages(newImages);
      // Update the currentImage state to be the first image in the newImages array, or null if the array is empty
      setCurrentImage(newImages.length > 0 ? newImages[0] : null);
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div>
      {/* Button to handle image upload */}
      <button style={{ cursor: 'pointer' }} onClick={handleUploadClick}>Upload Image</button>
       {/* Button to handle image deletion, only displayed if images are available */}
      {images.length > 0 && <button style={{ cursor: 'pointer' }} onClick={() => handleDelete(currentImage)}>Delete</button>}
    
      {/* Container for displaying the image gallery */}    
      <div className="image-gallery-container">
       {/* Using the react-image-gallery library to display the images */}  
        <ImageGallery items={images} onSlide={(index) => setCurrentImage(images[index])} 
          showPlayButton={false} 
          showFullscreenButton={false}
          />
      </div>
    </div>
  );
}

export default ImageUploader;
