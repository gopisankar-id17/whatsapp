import React from 'react';
import EmojiPicker from 'emoji-picker-react';

export default function ReactionPicker({ onReactionSelect, messageId }) {
  const [showFullPicker, setShowFullPicker] = React.useState(false);

  const quickReactions = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

  return (
    <div className="reaction-picker">
      {!showFullPicker ? (
        <div className="quick-reactions">
          {quickReactions.map((emoji) => (
            <button
              key={emoji}
              className="quick-reaction-btn"
              onClick={() => {
                onReactionSelect(emoji);
              }}
            >
              {emoji}
            </button>
          ))}
          <button
            className="reaction-more-btn"
            onClick={() => setShowFullPicker(true)}
            title="More reactions"
          >
            ⋯
          </button>
        </div>
      ) : (
        <div className="full-picker-wrapper">
          <EmojiPicker
            onEmojiClick={(emojiData) => {
              onReactionSelect(emojiData.emoji);
              setShowFullPicker(false);
            }}
            width={320}
            height={300}
            searchPlaceHolder="Search emoji"
            skinTonesDisabled
            previewConfig={{ showPreview: false }}
            theme="light"
          />
          <button
            className="picker-close-btn"
            onClick={() => setShowFullPicker(false)}
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
}
