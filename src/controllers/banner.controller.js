// controllers/banner.controller.js

import Banner from "../models/banner.model.js";
import {
  normalizeMediaItems,
  uploadBannerFiles,
  saveBannerByType
} from "../services/banner.service.js";

// ================= CREATE BANNER =================
export const createBanner = async (req, res, next) => {
  try {
    const { type, order, title, subtitle, link } = req.body;
    let mediaItems = normalizeMediaItems(req.body);

    // Validate required banner type before we start uploading files.
    if (!type) {
      return res.status(400).json({
        success: false,
        message: "Banner type is required"
      });
    }

    // Admin can send banner files directly here and we upload them before saving the banner.
    if (req.files && req.files.length > 0) {
      mediaItems = await uploadBannerFiles(req.files);
    }

    if (!Array.isArray(mediaItems) || mediaItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one banner media item is required"
      });
    }

    if (mediaItems.length > 5) {
      return res.status(400).json({
        success: false,
        message: "A banner slider can contain at most 5 media items"
      });
    }

    const banner = await Banner.create({
      type,
      mediaItems,
      order,
      title,
      subtitle,
      link
    });

    res.status(201).json({
      success: true,
      banner
    });

  } catch (error) {
    next(error);
  }
};

// ================= GET HERO BANNER =================
export const getHeroBanner = async (req, res, next) => {
  try {
    const banner = await Banner.findOne({
      type: "hero",
      isActive: true
    }).sort({ updatedAt: -1 });

    if (!banner) {
      return res.status(404).json({
        success: false,
        message: "Hero banner not found"
      });
    }

    res.status(200).json({
      success: true,
      banner
    });

  } catch (error) {
    next(error);
  }
};

// ================= SAVE HERO BANNER =================
export const saveHeroBanner = async (req, res, next) => {
  try {
    const existingBanner = await Banner.findOne({ type: "hero" }).sort({ updatedAt: -1 });
    const banner = await saveBannerByType({
      bannerType: "hero",
      body: req.body,
      files: req.files,
      existingBanner
    });

    res.status(existingBanner ? 200 : 201).json({
      success: true,
      banner
    });

  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    }

    next(error);
  }
};

// ================= GET BANNERS =================
export const getBanners = async (req, res, next) => {
  try {
    const { type } = req.query;

    const filter = { isActive: true };

    if (type) filter.type = type;

    const banners = await Banner.find(filter).sort({ order: 1 });

    res.status(200).json({
      success: true,
      banners
    });

  } catch (error) {
    next(error);
  }
};



// ================= UPDATE =================
export const updateBanner = async (req, res, next) => {
  try {
    const banner = await Banner.findById(req.params.id);

    if (!banner) {
      return res.status(404).json({ message: "Banner not found" });
    }

    let mediaItems = normalizeMediaItems(req.body);

    if (req.body.type !== undefined) banner.type = req.body.type;
    if (req.body.order !== undefined) banner.order = req.body.order;
    if (req.body.title !== undefined) banner.title = req.body.title;
    if (req.body.subtitle !== undefined) banner.subtitle = req.body.subtitle;
    if (req.body.link !== undefined) banner.link = req.body.link;
    if (req.body.isActive !== undefined) banner.isActive = req.body.isActive;

    // When new files are sent during update, re-upload them and replace the existing slider items.
    if (req.files && req.files.length > 0) {
      console.log(`Replacing banner media with ${req.files.length} new file(s)...`);
      mediaItems = await uploadBannerFiles(req.files);
    }

    // Replace slider items only when a new media payload is sent in the request.
    if (
      (req.files && req.files.length > 0) ||
      req.body.mediaItems !== undefined ||
      (req.body.media && req.body.mediaType)
    ) {
      if (!Array.isArray(mediaItems) || mediaItems.length === 0) {
        return res.status(400).json({
          success: false,
          message: "At least one banner media item is required"
        });
      }

      if (mediaItems.length > 5) {
        return res.status(400).json({
          success: false,
          message: "A banner slider can contain at most 5 media items"
        });
      }

      banner.mediaItems = mediaItems;
    }

    await banner.save();

    res.status(200).json({
      success: true,
      banner
    });

  } catch (error) {
    next(error);
  }
};



// ================= DELETE =================
export const deleteBanner = async (req, res, next) => {
  try {
    const banner = await Banner.findById(req.params.id);

    if (!banner) {
      return res.status(404).json({ message: "Banner not found" });
    }

    banner.isActive = false;

    await banner.save();

    res.status(200).json({
      success: true,
      message: "Banner removed"
    });

  } catch (error) {
    next(error);
  }
};
