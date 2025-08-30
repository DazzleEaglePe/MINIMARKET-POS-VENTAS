
-----------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM roles WHERE lower(nombre)='superadmin') THEN
    INSERT INTO roles(nombre) VALUES ('superadmin');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM roles WHERE lower(nombre)='gerente') THEN
    INSERT INTO roles(nombre) VALUES ('gerente');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM roles WHERE lower(nombre)='admin') THEN
    INSERT INTO roles(nombre) VALUES ('admin');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM roles WHERE lower(nombre)='cajero') THEN
    INSERT INTO roles(nombre) VALUES ('cajero');
  END IF;
END $$;
-----------------------------------------------------

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema='public' AND table_name='allowed_superadmins'
  ) THEN
    CREATE TABLE public.allowed_superadmins ( email text PRIMARY KEY );
    COMMENT ON TABLE public.allowed_superadmins IS 'Lista blanca de emails permitidos para rol superadmin';
  END IF;
END $$;

-----------------------------------------------------

CREATE OR REPLACE FUNCTION public.assign_default_permissions(p_id_usuario INT)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  v_id_rol INT;
  rec RECORD;
BEGIN
  SELECT id_rol INTO v_id_rol FROM usuarios WHERE id = p_id_usuario;
  IF v_id_rol IS NULL THEN RETURN; END IF;

  FOR rec IN
    SELECT pd.id_modulo
    FROM permisos_dafault pd
    WHERE pd.id_rol = v_id_rol AND pd.id_modulo IS NOT NULL
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM permisos p
      WHERE p.id_usuario = p_id_usuario AND p.idmodulo = rec.id_modulo
    ) THEN
      INSERT INTO permisos(id_usuario, idmodulo) VALUES (p_id_usuario, rec.id_modulo);
    END IF;
  END LOOP;
END;
$$;

-----------------------------------------------------

CREATE OR REPLACE FUNCTION public.insertarpermisohome() RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_id_modulo_home INT;
  v_id_rol INT;
  rec RECORD;
BEGIN
  SELECT u.id_rol INTO v_id_rol FROM usuarios u WHERE u.id = NEW.id;
  IF v_id_rol IS NULL THEN RETURN NEW; END IF;

  IF EXISTS (SELECT 1 FROM roles r WHERE r.id = v_id_rol AND lower(r.nombre) <> 'superadmin') THEN
    SELECT m.id INTO v_id_modulo_home FROM modulos m WHERE m.link = '/' LIMIT 1;
    IF v_id_modulo_home IS NOT NULL AND NOT EXISTS (
      SELECT 1 FROM permisos p WHERE p.id_usuario = NEW.id AND p.idmodulo = v_id_modulo_home
    ) THEN
      INSERT INTO permisos (id_usuario, idmodulo) VALUES (NEW.id, v_id_modulo_home);
    END IF;

    FOR rec IN
      SELECT pd.id_modulo
      FROM permisos_dafault pd
      WHERE pd.id_rol = v_id_rol AND pd.id_modulo IS NOT NULL
    LOOP
      IF NOT EXISTS (
        SELECT 1 FROM permisos p WHERE p.id_usuario = NEW.id AND p.idmodulo = rec.id_modulo
      ) THEN
        INSERT INTO permisos(id_usuario, idmodulo) VALUES (NEW.id, rec.id_modulo);
      END IF;
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;
-----------------------------------------------------

CREATE OR REPLACE FUNCTION public.bootstrap_user_after_login(p_id_auth text, p_email text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user usuarios%ROWTYPE;
  v_role_super INT;
  v_role_default INT;
  v_emp empresa%ROWTYPE;
BEGIN
  SELECT * INTO v_user FROM usuarios WHERE id_auth = p_id_auth LIMIT 1;

  SELECT id INTO v_role_super FROM roles WHERE lower(nombre) = 'superadmin' LIMIT 1;
  SELECT id INTO v_role_default FROM roles 
    WHERE lower(nombre) IN ('cajero','gerente','admin')
    ORDER BY CASE WHEN lower(nombre)='cajero' THEN 0 WHEN lower(nombre)='gerente' THEN 1 ELSE 2 END
    LIMIT 1;

  IF v_user.id IS NULL THEN
    IF EXISTS (SELECT 1 FROM allowed_superadmins WHERE lower(email) = lower(p_email)) AND v_role_super IS NOT NULL THEN
      v_role_default := v_role_super;
    END IF;

    INSERT INTO usuarios (id_auth, correo, id_rol, nombres)
    VALUES (p_id_auth, p_email, v_role_default, split_part(p_email,'@',1))
    RETURNING * INTO v_user;
  END IF;

  IF v_role_super IS NOT NULL AND v_user.id_rol = v_role_super THEN
    SELECT * INTO v_emp FROM empresa WHERE id_auth = p_id_auth LIMIT 1;
    IF v_emp.id IS NULL THEN
      INSERT INTO empresa (id_auth, correo, id_usuario) VALUES (p_id_auth, p_email, v_user.id);
    END IF;
  END IF;

  IF NOT (v_role_super IS NOT NULL AND v_user.id_rol = v_role_super) THEN
    PERFORM public.assign_default_permissions(v_user.id);
  END IF;

  RETURN json_build_object('usuario', v_user);
END;
$$;
-----------------------------------------------------
CREATE OR REPLACE FUNCTION public.insertpordefecto() RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  new_id_sucursal int;
  new_id_tipo_documento int;
  id_superadmin_rol INT;
  id_admin_rol INT;
  new_id_usuario INT;
  new_id_caja int;
  new_id_categoria int;
  item record;
BEGIN
  INSERT INTO tipodocumento(nombre,id_empresa)
  VALUES('Generico',NEW.id)
  RETURNING id INTO new_id_tipo_documento;

  SELECT id INTO id_superadmin_rol FROM roles WHERE lower(nombre) = 'superadmin' LIMIT 1;
  SELECT id INTO id_admin_rol FROM roles WHERE lower(nombre) = 'admin' LIMIT 1;

  INSERT INTO usuarios(nombres,id_tipodocumento,id_rol,correo,id_auth)
  VALUES(
    'Generico',
    new_id_tipo_documento,
    CASE
      WHEN EXISTS (SELECT 1 FROM allowed_superadmins WHERE lower(email) = lower(NEW.correo)) AND id_superadmin_rol IS NOT NULL THEN id_superadmin_rol
      ELSE COALESCE(id_admin_rol, id_superadmin_rol)
    END,
    NEW.correo,
    NEW.id_auth
  )
  RETURNING id INTO new_id_usuario;

  IF id_superadmin_rol IS NOT NULL AND (SELECT id_rol FROM usuarios WHERE id = new_id_usuario) = id_superadmin_rol THEN
    FOR item IN SELECT id FROM modulos LOOP
      INSERT INTO permisos(id_usuario,idmodulo) VALUES(new_id_usuario,item.id);
    END LOOP;
  END IF;

  UPDATE empresa SET id_usuario=new_id_usuario WHERE id_usuario IS NULL;

  INSERT INTO sucursales(nombre,direccion_fiscal,id_empresa,delete)
  VALUES(NEW.nombre,NEW.direccion_fiscal,NEW.id,false)
  RETURNING id INTO new_id_sucursal;

  INSERT INTO almacen(id_sucursal,delete,nombre)
  VALUES(new_id_sucursal,false,'Almacen principal');

  INSERT INTO caja (descripcion,id_sucursal,delete)
  VALUES('Caja principal',new_id_sucursal,false)
  RETURNING id INTO new_id_caja;

  INSERT INTO asignacion_sucursal(id_sucursal,id_usuario,id_caja)
  VALUES(new_id_sucursal,new_id_usuario,new_id_caja);

  INSERT INTO categorias(nombre,color,icono,id_empresa)
  VALUES('General','#FEC701','-',NEW.id)
  RETURNING id INTO new_id_categoria;

  INSERT INTO productos(nombre,precio_venta,precio_compra,id_categoria,codigo_barras,codigo_interno,id_empresa)
  VALUES('Producto de prueba',10,5,new_id_categoria,'123456789','000123456',NEW.id);

  INSERT INTO clientes_proveedores(nombres,id_empresa) VALUES ('Generico',NEW.id);

  INSERT INTO metodos_pago(nombre,id_empresa) VALUES ('Efectivo',NEW.id);
  INSERT INTO metodos_pago(nombre,id_empresa) VALUES ('Tarjeta',NEW.id);
  INSERT INTO metodos_pago(nombre,id_empresa) VALUES ('Credito',NEW.id);
  INSERT INTO metodos_pago(nombre,id_empresa) VALUES ('Mixto',NEW.id);

  RETURN NEW;
END
$$;

-----------------------------------------------------

DO $$
DECLARE
  r_super INT; r_admin INT; r_gerente INT; r_cajero INT;
  m_home INT; m_pos INT; m_cobrar INT; m_dashboard INT; m_inventarios INT; m_config INT;
  m_empresa INT; m_emp_basicos INT; m_emp_moneda INT; m_categorias INT; m_productos INT; m_clientes INT;
  m_proveedores INT; m_metodos INT; m_sucu_caja INT; m_usuarios INT; m_ticket INT; m_serial INT; m_almacenes INT;
  m INT;
BEGIN
  SELECT id INTO r_super FROM roles WHERE lower(nombre) = 'superadmin' LIMIT 1;
  SELECT id INTO r_admin FROM roles WHERE lower(nombre) = 'admin' LIMIT 1;
  SELECT id INTO r_gerente FROM roles WHERE lower(nombre) = 'gerente' LIMIT 1;
  SELECT id INTO r_cajero FROM roles WHERE lower(nombre) = 'cajero' LIMIT 1;

  SELECT id INTO m_home FROM modulos WHERE link = '/' LIMIT 1;
  SELECT id INTO m_pos FROM modulos WHERE link = '/pos' LIMIT 1;
  SELECT id INTO m_cobrar FROM modulos WHERE nombre ILIKE 'cobrar venta' LIMIT 1;
  SELECT id INTO m_dashboard FROM modulos WHERE link = '/dashboard' LIMIT 1;
  SELECT id INTO m_inventarios FROM modulos WHERE link = '/inventario' LIMIT 1;
  SELECT id INTO m_config FROM modulos WHERE link = '/configuracion' LIMIT 1;
  SELECT id INTO m_empresa FROM modulos WHERE link = '/configuracion/empresa' LIMIT 1;
  SELECT id INTO m_emp_basicos FROM modulos WHERE link = '/configuracion/empresa/empresabasicos' LIMIT 1;
  SELECT id INTO m_emp_moneda FROM modulos WHERE link = '/configuracion/empresa/monedaconfig' LIMIT 1;
  SELECT id INTO m_categorias FROM modulos WHERE link = '/configuracion/categorias' LIMIT 1;
  SELECT id INTO m_productos FROM modulos WHERE link = '/configuracion/productos' LIMIT 1;
  SELECT id INTO m_clientes FROM modulos WHERE link = '/configuracion/clientes' LIMIT 1;
  SELECT id INTO m_proveedores FROM modulos WHERE link = '/configuracion/proveedores' LIMIT 1;
  SELECT id INTO m_metodos FROM modulos WHERE link = '/configuracion/metodospago' LIMIT 1;
  SELECT id INTO m_sucu_caja FROM modulos WHERE link = '/configuracion/sucursalcaja' LIMIT 1;
  SELECT id INTO m_usuarios FROM modulos WHERE link = '/configuracion/usuarios' LIMIT 1;
  SELECT id INTO m_ticket FROM modulos WHERE link = '/configuracion/ticket' LIMIT 1;
  SELECT id INTO m_serial FROM modulos WHERE link = '/configuracion/serializacion' LIMIT 1;
  SELECT id INTO m_almacenes FROM modulos WHERE link = '/configuracion/almacenes' LIMIT 1;

  IF r_cajero IS NOT NULL THEN
    IF m_home IS NOT NULL THEN INSERT INTO permisos_dafault(id_rol, id_modulo)
      SELECT r_cajero, m_home WHERE NOT EXISTS (SELECT 1 FROM permisos_dafault WHERE id_rol=r_cajero AND id_modulo=m_home); END IF;
    IF m_pos IS NOT NULL THEN INSERT INTO permisos_dafault(id_rol, id_modulo)
      SELECT r_cajero, m_pos WHERE NOT EXISTS (SELECT 1 FROM permisos_dafault WHERE id_rol=r_cajero AND id_modulo=m_pos); END IF;
    IF m_cobrar IS NOT NULL THEN INSERT INTO permisos_dafault(id_rol, id_modulo)
      SELECT r_cajero, m_cobrar WHERE NOT EXISTS (SELECT 1 FROM permisos_dafault WHERE id_rol=r_cajero AND id_modulo=m_cobrar); END IF;
    IF m_clientes IS NOT NULL THEN INSERT INTO permisos_dafault(id_rol, id_modulo)
      SELECT r_cajero, m_clientes WHERE NOT EXISTS (SELECT 1 FROM permisos_dafault WHERE id_rol=r_cajero AND id_modulo=m_clientes); END IF;
  END IF;

  IF r_gerente IS NOT NULL THEN
    FOREACH m IN ARRAY ARRAY[m_home,m_dashboard,m_pos,m_cobrar,m_inventarios,m_categorias,m_productos,m_clientes,m_proveedores,m_metodos,m_almacenes,m_config]
    LOOP
      IF m IS NOT NULL THEN
        INSERT INTO permisos_dafault(id_rol, id_modulo)
        SELECT r_gerente, m WHERE NOT EXISTS (SELECT 1 FROM permisos_dafault WHERE id_rol=r_gerente AND id_modulo=m);
      END IF;
    END LOOP;
  END IF;

  IF r_admin IS NOT NULL THEN
    FOREACH m IN ARRAY ARRAY[m_home,m_dashboard,m_pos,m_cobrar,m_inventarios,m_config,m_empresa,m_emp_basicos,m_emp_moneda,m_categorias,m_productos,m_clientes,m_proveedores,m_metodos,m_sucu_caja,m_usuarios,m_ticket,m_serial,m_almacenes]
    LOOP
      IF m IS NOT NULL THEN
        INSERT INTO permisos_dafault(id_rol, id_modulo)
        SELECT r_admin, m WHERE NOT EXISTS (SELECT 1 FROM permisos_dafault WHERE id_rol=r_admin AND id_modulo=m);
      END IF;
    END LOOP;
  END IF;
END $$;
-----------------------------------------------------

INSERT INTO allowed_superadmins(email) VALUES ('jeanavila2109@superadmin.com') ON CONFLICT DO NOTHING;
-- Repite por cada correo whitelisted
INSERT INTO allowed_superadmins(email) VALUES ('brunoty000@gmail.com') ON CONFLICT DO NOTHING;


-----------------------------------------------------

-- Ver defaults por rol
SELECT r.nombre rol, m.link
FROM permisos_dafault pd
JOIN roles r ON r.id=pd.id_rol
JOIN modulos m ON m.id=pd.id_modulo
ORDER BY 1,2;

-- Ver permisos por usuario
SELECT u.correo, r.nombre rol, COUNT(p.*) permisos
FROM usuarios u 
JOIN roles r ON r.id=u.id_rol
LEFT JOIN permisos p ON p.id_usuario=u.id
GROUP BY 1,2
ORDER BY 1;

SELECT * FROM usuarios

SELECT * FROM roles

SELECT * FROM allowed_superadmins

-----------------------------------------------------
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM roles WHERE lower(nombre)='superadmin') THEN
    INSERT INTO roles(nombre) VALUES ('superadmin');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM roles WHERE lower(nombre)='gerente') THEN
    INSERT INTO roles(nombre) VALUES ('gerente');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM roles WHERE lower(nombre)='admin') THEN
    INSERT INTO roles(nombre) VALUES ('admin');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM roles WHERE lower(nombre)='cajero') THEN
    INSERT INTO roles(nombre) VALUES ('cajero');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM roles WHERE lower(nombre)='pendiente') THEN
    INSERT INTO roles(nombre) VALUES ('pendiente');
  END IF;
END $$;

-----------------------------------------------------

CREATE OR REPLACE FUNCTION public.assign_default_permissions(p_id_usuario INT)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  v_id_rol INT;
  rec RECORD;
BEGIN
  SELECT id_rol INTO v_id_rol FROM usuarios WHERE id = p_id_usuario;
  IF v_id_rol IS NULL THEN
    RETURN;
  END IF;

  FOR rec IN
    SELECT pd.id_modulo
    FROM permisos_dafault pd
    WHERE pd.id_rol = v_id_rol AND pd.id_modulo IS NOT NULL
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM permisos p
      WHERE p.id_usuario = p_id_usuario AND p.idmodulo = rec.id_modulo
    ) THEN
      INSERT INTO permisos(id_usuario, idmodulo)
      VALUES (p_id_usuario, rec.id_modulo);
    END IF;
  END LOOP;
END;
$$;

-----------------------------------------------------

CREATE OR REPLACE FUNCTION public.bootstrap_user_after_login(p_id_auth text, p_email text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user usuarios%ROWTYPE;
  v_role_super INT;
  v_role_default INT;
  v_emp empresa%ROWTYPE;
BEGIN
  SELECT * INTO v_user FROM usuarios WHERE id_auth = p_id_auth LIMIT 1;

  SELECT id INTO v_role_super FROM roles WHERE lower(nombre) = 'superadmin' LIMIT 1;
  -- prioridad: pendiente (cero permisos) > cajero > gerente > admin
  SELECT id INTO v_role_default FROM roles 
  WHERE lower(nombre) IN ('pendiente','cajero','gerente','admin')
  ORDER BY CASE 
    WHEN lower(nombre)='pendiente' THEN 0
    WHEN lower(nombre)='cajero' THEN 1
    WHEN lower(nombre)='gerente' THEN 2
    ELSE 3 END
  LIMIT 1;

  IF v_user.id IS NULL THEN
    IF EXISTS (SELECT 1 FROM allowed_superadmins WHERE lower(email) = lower(p_email)) AND v_role_super IS NOT NULL THEN
      v_role_default := v_role_super;
    END IF;

    INSERT INTO usuarios (id_auth, correo, id_rol, nombres)
    VALUES (p_id_auth, p_email, v_role_default, split_part(p_email,'@',1))
    RETURNING * INTO v_user;
  END IF;

  IF v_role_super IS NOT NULL AND v_user.id_rol = v_role_super THEN
    SELECT * INTO v_emp FROM empresa WHERE id_auth = p_id_auth LIMIT 1;
    IF v_emp.id IS NULL THEN
      INSERT INTO empresa (id_auth, correo, id_usuario) VALUES (p_id_auth, p_email, v_user.id);
    END IF;
  END IF;

  -- Solo asigna permisos si NO es superadmin NI pendiente
  IF NOT (v_role_super IS NOT NULL AND v_user.id_rol = v_role_super)
     AND NOT EXISTS (SELECT 1 FROM roles r WHERE r.id = v_user.id_rol AND lower(r.nombre) = 'pendiente')
  THEN
    PERFORM public.assign_default_permissions(v_user.id);
  END IF;

  RETURN json_build_object('usuario', v_user);
END;
$$;

-----------------------------------------------------

CREATE OR REPLACE FUNCTION public.insertarpermisohome() RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_id_modulo_home INT;
  v_id_rol INT;
  rec RECORD;
BEGIN
  -- Ignorar superadmin y pendiente
  SELECT u.id_rol INTO v_id_rol FROM usuarios u WHERE u.id = NEW.id;
  IF v_id_rol IS NULL THEN
    RETURN NEW;
  END IF;

  IF EXISTS (
    SELECT 1 FROM roles r
    WHERE r.id = v_id_rol AND lower(r.nombre) NOT IN ('superadmin','pendiente')
  ) THEN
    SELECT m.id INTO v_id_modulo_home FROM modulos m WHERE m.link = '/' LIMIT 1;
    IF v_id_modulo_home IS NOT NULL AND NOT EXISTS (
      SELECT 1 FROM permisos p WHERE p.id_usuario = NEW.id AND p.idmodulo = v_id_modulo_home
    ) THEN
      INSERT INTO permisos (id_usuario, idmodulo) VALUES (NEW.id, v_id_modulo_home);
    END IF;

    FOR rec IN
      SELECT pd.id_modulo FROM permisos_dafault pd
      WHERE pd.id_rol = v_id_rol AND pd.id_modulo IS NOT NULL
    LOOP
      IF NOT EXISTS (
        SELECT 1 FROM permisos p WHERE p.id_usuario = NEW.id AND p.idmodulo = rec.id_modulo
      ) THEN
        INSERT INTO permisos(id_usuario, idmodulo) VALUES (NEW.id, rec.id_modulo);
      END IF;
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

-----------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'triggerinsertarpermisohome') THEN
    EXECUTE $X$CREATE TRIGGER triggerinsertarpermisohome
    AFTER INSERT ON public.usuarios
    FOR EACH ROW EXECUTE FUNCTION public.insertarpermisohome()$X$;
  END IF;
END$$;