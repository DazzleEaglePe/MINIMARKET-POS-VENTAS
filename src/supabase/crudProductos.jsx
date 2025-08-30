
import { supabase } from "../index";
const tabla = "productos";
export async function InsertarProductos(p) {
  const { error, data } = await supabase.rpc("insertarproductos", p);
  if (error) {
    throw new Error(error.message);
  }
  console.log(data);
  return data;
}

export async function MostrarProductos(p) {
  const { data } = await supabase.rpc("mostrarproductos", {
    _id_empresa: p.id_empresa,
  });
  return data;
}
export async function BuscarProductos(p) {
  const { data, error } = await supabase.rpc("buscarproductos", {
    _id_empresa: p.id_empresa,
    buscador: p.buscador,
  });

  if (error) {
    throw new Error(error.message);
  }
  return data;
}
export async function EliminarProductos(p) {
  const { error } = await supabase.from(tabla).delete().eq("id", p.id);
  if (error) {
    // Postgres 23503 = foreign_key_violation. Happens when the product was used in ventas (detalle_venta)
    if (error.code === "23503") {
      const friendly =
        "No se puede eliminar el producto porque está referenciado en ventas (detalle_venta). Considera desactivarlo en lugar de eliminarlo.";
      const err = new Error(friendly);
      err.code = error.code;
      err.details = error.details;
      throw err;
    }
    // Fallback to the original error message for other cases
    const err = new Error(error.message || "No se pudo eliminar el producto.");
    err.code = error.code;
    err.details = error.details;
    throw err;
  }
}
export async function EditarProductos(p) {
  const { error } = await supabase.rpc("editarproductos", p);
  if (error) {
    throw new Error(error.message);
  }
}

export async function MostrarUltimoProducto(p) {
  const { data } = await supabase
    .from(tabla)
    .select()
    .eq("id_empresa", p.id_empresa)
    .order("id", { ascending: false })
    .maybeSingle();

  return data;
}
