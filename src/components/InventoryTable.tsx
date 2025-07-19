import * as React from "react";
import { Button } from "@/components/ui/button";

// דוגמה לנתוני מלאי
const mockData = [
	{
		name: "קופסת ברגים (M6)",
	 barcode: "7290001234567",
		quantity: 87,
		location: 'מרלו"ג מרכז',
		supplier: 'כלי-ברזל בע"מ',
	},
	{
		name: "דבק אפוקסי",
		barcode: "7290002345678",
		quantity: 17,
		location: "סניף תל אביב",
		supplier: "ספק מבנים",
	},
	{
		name: "ארגז כלים קטן",
		barcode: "7290001987654",
		quantity: 4,
		location: "מחסן חיפה",
		supplier: "י.א. בניה",
	},
	{
		name: "פלאייר מקצועי",
		barcode: "7290001789654",
		quantity: 38,
		location: 'מרלו"ג מרכז',
		supplier: 'כלי-ברזל בע"מ',
	},
	{
		name: "מברגת בוש",
		barcode: "7290001118222",
		quantity: 0,
		location: "סניף תל אביב",
		supplier: "יצחק חשמל",
	},
];

const InventoryTableRow = ({
	item,
	index,
}: {
	item: (typeof mockData)[0];
	index: number;
}) => (
	<tr key={item.barcode} className={index % 2 === 0 ? "bg-white" : "bg-muted"}>
		<td className="px-4 py-2 font-semibold">{item.name}</td>

		<td
			className={
				item.quantity === 0 ? "px-4 py-2 text-red-600 font-bold" : "px-4 py-2"
			}
		>
			{item.quantity}
		</td>

		<td className="px-4 py-2">{item.supplier}</td>
		<td className="px-4 py-2">
			<Button
				size="sm"
				variant="outline"
				className="font-bold hover:bg-muted hover:text-black"
			>
				ערוך
			</Button>
		</td>
	</tr>
);

const InventoryTable = ({ products }: { products?: typeof mockData }) => {
	const [search, setSearch] = React.useState("");
	// Use products prop if provided, otherwise load from localStorage
	const [localProducts, setLocalProducts] = React.useState<typeof mockData>([]);
	React.useEffect(() => {
		if (!products) {
			const stored = localStorage.getItem('products');
			if (stored) {
				setLocalProducts(JSON.parse(stored));
			}
		}
	}, [products]);
	const data = products || localProducts;
	// Filter out items with quantity 0
	const filtered = data
		.filter((item) => item.quantity > 0)
		.filter(
			(item) =>
				item.name.includes(search) ||
				item.barcode.includes(search) ||
				item.location?.includes(search) ||
				item.supplier.includes(search)
		);

	return (
		<div>
			<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-2">
				<input
					className="border bg-muted px-3 py-2 rounded-md w-full sm:w-56 outline-none focus:ring-2 focus:ring-primary"
					placeholder="חפש לפי שם פריט"
					value={search}
					dir="rtl"
					onChange={(e) => setSearch(e.target.value)}
				/>
			</div>
			<div className="overflow-x-auto rounded-md border">
				<table className="min-w-full divide-y divide-border text-right">
					<thead className="bg-muted">
						<tr>
							<th className="px-4 py-2">שם פריט</th>
							<th className="px-4 py-2">כמות</th>
							<th className="px-4 py-2">ספק</th>
							<th className="px-4 py-2"></th>
						</tr>
					</thead>
					<tbody>
						{filtered.length === 0 ? (
							<tr>
								<td colSpan={6} className="text-center p-8 text-gray-500">
									לא נמצאו תוצאות
								</td>
							</tr>
						) : (
							filtered.map((item, i) => (
								<tr key={item.barcode} className={i % 2 === 0 ? "bg-white" : "bg-muted"}>
									<td className="px-4 py-2 font-semibold">{item.name}</td>
									<td className={item.quantity === 0 ? "px-4 py-2 text-red-600 font-bold" : "px-4 py-2"}>{item.quantity}</td>
									<td className="px-4 py-2">{item.supplier}</td>
									<td className="px-4 py-2">
										<Button size="sm" variant="outline" className="font-bold hover:bg-muted hover:text-black">ערוך</Button>
									</td>
								</tr>
							))
						)}
					</tbody>
				</table>
			</div>
		</div>
	);
};

export default InventoryTable;
