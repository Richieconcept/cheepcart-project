import Banner from "../models/banner.model.js";
import { saveBannerByType } from "../services/banner.service.js";

// Side banner lives in its own controller so admin/frontend do not mix it with hero banner flow.
export const getSideBanner = async (req, res, next) => {
  try {
    const banner = await Banner.findOne({
      type: "secondary",
      isActive: true
    }).sort({ updatedAt: -1 });

    if (!banner) {
      return res.status(404).json({
        success: false,
        message: "Side banner not found"
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

// Admin keeps one side-banner slider up to date by replacing it through this route.
export const saveSideBanner = async (req, res, next) => {
  try {
    const existingBanner = await Banner.findOne({ type: "secondary" }).sort({ updatedAt: -1 });
    const banner = await saveBannerByType({
      bannerType: "secondary",
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
