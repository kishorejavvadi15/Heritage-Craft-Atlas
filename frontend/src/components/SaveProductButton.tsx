import React from 'react';

interface SaveProductButtonProps {
  saved: boolean;
  onToggle: () => void;
  className?: string;
}

const SaveProductButton: React.FC<SaveProductButtonProps> = ({ saved, onToggle, className }) => {
  return (
    <button
      type="button"
      className={className}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onToggle();
      }}
      aria-pressed={saved}
      aria-label={saved ? 'Remove from saved products' : 'Save product'}
    >
      {saved ? 'Saved' : 'Save'}
    </button>
  );
};

export default SaveProductButton;
