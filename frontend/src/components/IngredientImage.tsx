import { getIngredientVisual } from "../data/ingredientImages";

type Props = {
  name: string;
  size?: number;
};

export default function IngredientImage({ name, size = 48 }: Props) {
  const visual = getIngredientVisual(name);

  if (visual.image) {
    return (
      <img
        src={visual.image}
        alt={name}
        width={size}
        height={size}
        className="rounded-xl object-cover border border-neutral-200"
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <div
      className="flex items-center justify-center rounded-xl border border-neutral-200"
      style={{
        width: size,
        height: size,
        background: visual.bg,
        fontSize: size * 0.5,
      }}
    >
      <span>{visual.emoji}</span>
    </div>
  );
}