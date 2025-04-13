function Input({ text, setText, type }) {
  return (
    <input
      type = {type}
      id={text}
      value={text}
      onChange={(e) => setText(e.target.value)}
      required
    />
  );
}

export default Input;