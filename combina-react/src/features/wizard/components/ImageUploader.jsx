import { useRef, useState } from 'react';

export function ImageUploader({ partIndex, onFiles }) {
  const inputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleClick = () => inputRef.current?.click();

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    onFiles(e.dataTransfer.files);
  };

  const handleChange = (e) => {
    onFiles(e.target.files);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div
      className={`image-upload-area ${isDragging ? 'dragging' : ''}`}
      onClick={handleClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      <span>Haz clic o arrastra imágenes aquí</span>
      <div className="upload-hint">Formatos: PNG, JPG, GIF, WEBP</div>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={handleChange}
        hidden
        data-part-index={partIndex}
      />
    </div>
  );
}