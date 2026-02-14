import asyncio
import json
import math
from fastapi import logger
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.material_details_repo import MaterialDetailsRepository
from app.repositories.materials_repo import MaterialRepository
from app.core.exceptions import NotFoundException
from app.utils.pagination import build_pagination_meta
from app.utils.formatters import format_section14, format_section2, format_section3, format_section9

# class MaterialService:

#     def __init__(self, db):
#         self.repo = MaterialRepository(db)
#         self.details_repo = MaterialDetailsRepository(db)

#     async def list_materials(
#         self,
#         material_type: str = "raw_material",
#         page: int = 1,
#         page_size: int = 20,
#     ):
#         total_records = await self.repo.count_materials(material_type)

#         offset = (page - 1) * page_size

#         masters = await self.repo.get_materials(
#             material_type,
#             page_size,
#             offset
#         )

#         results = []

#         for m in masters:
#             sds_info = await self.details_repo.get_sds_info(m["material_code"])
#             hazards = await self.details_repo.get_hazards(m["material_code"])
#             props = await self.details_repo.get_properties(m["material_code"])
#             transport = await self.details_repo.get_transport(m["material_code"])
#             ghs = await self.details_repo.get_ghs(m["material_code"])
#             dg = await self.details_repo.get_dg(m["material_code"])
#             composition = await self.details_repo.get_composition(m["material_id"])
#             toxicology = await self.details_repo.get_toxicology(m["material_id"])


#             results.append({
#                 "id": m["material_id"],
#                 "material_id": m["material_code"],
#                 "material_name": m["material_name"],
#                 "internal_code": "",
#                 "intended_use": sds_info['recommended_use'],
#                 "product_type": composition[0]['product_type'],
#                 "part_number": sds_info['product_identifier'] if sds_info else None,
#                 "source": m["source_file_path"],
#                 "sdssheet_url": m["pdf_file_path"],
#                 "manufacturer": sds_info["supplier_name"] if sds_info else None,
#                 "manufacturer_location": sds_info["supplier_address"] if sds_info else None,
#                 "emergency_contact": sds_info["emergency_phone"] if sds_info else None,
#                 "ai_recommended_dgcode": dg["dg_classification"] if dg else None,
#                 "rationale_summary": dg["rationale_summary"] if dg else None,
#                 "ghs_rationale": ghs["ghs_reason"] if ghs else None,
#                 "dg_rationale": dg["dg_reason"] if dg else None,
#                 "ghs_status": ghs['ghs_status'],
#                 "dg_status": dg['dg_status'],
#                 "ghs_pictograms": json.loads(hazards["pictograms"]) if hazards["pictograms"] else [],
#                 "hazardous_waste": dg["hazardous_waste"] if dg else None,
#                 "GHS Approval/Rejection Date": ghs['reviewed_at'],
#                 "DG Approval/Rejection Date": dg['reviewed_at'],
#                 "feedback": "",
#                 "sections": {
#                     "section2": format_section2(hazards),
#                     "section3": format_section3(composition, sds_info, ghs, dg),
#                     "section9": format_section9(props),
#                     "section14": format_section14(transport)
#                 },
#                 "uploaded_date": m["extraction_timestamp"]
#             })


#         pagination_meta = build_pagination_meta(
#             page=page,
#             page_size=page_size,
#             total_records=total_records,
#         )

#         return {
#             "data": results,
#             "meta": {
#                 "pagination": pagination_meta
#             }
#         }







class MaterialService:

    def __init__(self, db):
        self.repo = MaterialRepository(db)
        self.details_repo = MaterialDetailsRepository(db)

    async def _safe_call(self, coro, default=None, msg=""):
        try:
            return await coro
        except Exception:
            logger.exception(msg)
            return default

    async def _build_material(self, m):
        material_code = m.get("material_code")
        material_id = m.get("material_id")

        # Run ALL detail queries in parallel
        (
            sds_info,
            hazards,
            props,
            transport,
            ghs,
            dg,
            composition,
            toxicology
        ) = await asyncio.gather(
            self._safe_call(self.details_repo.get_sds_info(material_code), {}, f"sds {material_code}"),
            self._safe_call(self.details_repo.get_hazards(material_code), {}, f"hazards {material_code}"),
            self._safe_call(self.details_repo.get_properties(material_code), {}, f"props {material_code}"),
            self._safe_call(self.details_repo.get_transport(material_code), {}, f"transport {material_code}"),
            self._safe_call(self.details_repo.get_ghs(material_code), {}, f"ghs {material_code}"),
            self._safe_call(self.details_repo.get_dg(material_code), {}, f"dg {material_code}"),
            self._safe_call(self.details_repo.get_composition(material_id), [], f"composition {material_code}"),
            self._safe_call(self.details_repo.get_toxicology(material_id), [], f"toxicology {material_code}"),
        )

        product_type = (
            composition[0].get("product_type")
            if composition else None
        )

        pictograms = []
        try:
            if hazards.get("pictograms"):
                pictograms = json.loads(hazards["pictograms"])
        except Exception:
            logger.warning(f"Bad pictogram JSON {material_code}")

        return {
            "id": material_id,
            "material_id": material_code,
            "material_name": m.get("material_name"),
            "internal_code": "",
            "intended_use": sds_info.get("recommended_use"),
            "product_type": product_type,
            "part_number": sds_info.get("product_identifier"),
            "source": m.get("source_file_path"),
            "sdssheet_url": m.get("pdf_file_path"),
            "manufacturer": sds_info.get("supplier_name"),
            "manufacturer_location": sds_info.get("supplier_address"),
            "emergency_contact": sds_info.get("emergency_phone"),
            "ai_recommended_dgcode": dg.get("dg_classification"),
            "rationale_summary": dg.get("rationale_summary"),
            "ghs_rationale": ghs.get("ghs_reason"),
            "dg_rationale": dg.get("dg_reason"),
            "ghs_status": ghs.get("ghs_status"),
            "dg_status": dg.get("dg_status"),
            "ghs_pictograms": pictograms,
            "hazardous_waste": dg.get("hazardous_waste"),
            "GHS Approval/Rejection Date": ghs.get("reviewed_at"),
            "DG Approval/Rejection Date": dg.get("reviewed_at"),
            "feedback": "",
            "sections": {
                "section2": format_section2(hazards),
                "section3": format_section3(composition, sds_info, ghs, dg),
                "section9": format_section9(props),
                "section14": format_section14(transport),
            },
            "uploaded_date": m.get("extraction_timestamp"),
        }

    async def list_materials(self, material_type="raw_material", page=1, page_size=20):

        if page < 1:
            raise ValueError("page must be >= 1")

        if page_size > 200:
            raise ValueError("page_size too large")

        try:
            total_records, masters = await asyncio.gather(
                self.repo.count_materials(material_type),
                self.repo.get_materials(material_type, page_size, (page - 1) * page_size)
            )
        except Exception:
            logger.exception("Failed fetching materials")
            raise RuntimeError("DB failure")

        # Process all materials concurrently
        tasks = [self._build_material(m) for m in masters]

        results = await asyncio.gather(*tasks, return_exceptions=True)

        # Remove failed ones but log
        final_results = []
        for r in results:
            if isinstance(r, Exception):
                logger.exception("Material build failed")
            else:
                final_results.append(r)

        pagination_meta = build_pagination_meta(
            page=page,
            page_size=page_size,
            total_records=total_records,
        )

        return {
            "data": final_results,
            "meta": {"pagination": pagination_meta},
        }