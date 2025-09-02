import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBookmark,
  faFlag,
  faStar,
  faEye,
  faTrashAlt,
  faEllipsisV,
  faDownload,
} from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "../../context/AuthContext/AuthContext";
import { useResource } from "../../context/ResourceContext/ResourceContext";
import { useModal } from "../../context/ModalContext/ModalContext";
import { Link } from "react-router-dom";

const UniversalResourceCard = React.memo(
  ({
    resource,
    variant = "default",
    showPreview = true,
    showActions = true,
    showStats = true,
    showDescription = true,
  }) => {
    const { token, isAuthenticated, user } = useAuth();
    const { showModal } = useModal();
    const isAdmin = user?.roles === "admin";
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef(null);

    const {
      handleSave,
      handleFlag,
      handleUnsave,
      handleDelete,
    } = useResource();

    const isOwner = user && resource.uploadedBy?._id === user._id;

    const getFileExtension = (url) => {
      if (!url) return "";
      try {
        const path = new URL(url).pathname;
        const lastDotIndex = path.lastIndexOf(".");
        if (lastDotIndex > -1) {
          return path.substring(lastDotIndex).split(/[?#]/)[0].toLowerCase();
        }
      } catch (e) {
        console.error("Error parsing URL:", e);
      }
      return "";
    };

    const isPDF =
      resource.cloudinaryUrl &&
      getFileExtension(resource.cloudinaryUrl) === ".pdf";
    const isImage =
      resource.cloudinaryUrl &&
      [".jpg", ".jpeg", ".png", ".gif", ".svg"].includes(
        getFileExtension(resource.cloudinaryUrl)
      );

    useEffect(() => {
      const handleClickOutside = (event) => {
        if (menuRef.current && !menuRef.current.contains(event.target)) {
          setIsMenuOpen(false);
        }
      };

      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, []);

    const renderStars = (rating) => {
      const fullStars = Math.floor(rating);
      const hasHalfStar = rating % 1 >= 0.5;
      const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

      return (
        <div className="flex items-center gap-0.5">
          {[...Array(fullStars)].map((_, i) => (
            <FontAwesomeIcon
              key={`full-${i}`}
              icon={faStar}
              className="text-amber-400 text-xs drop-shadow-sm"
            />
          ))}
          {hasHalfStar && (
            <FontAwesomeIcon
              icon={faStar}
              className="text-amber-400 opacity-50 text-xs drop-shadow-sm"
            />
          )}
          {[...Array(emptyStars)].map((_, i) => (
            <FontAwesomeIcon
              key={`empty-${i}`}
              icon={faStar}
              className="text-gray-300 dark:text-gray-600 text-xs"
            />
          ))}
        </div>
      );
    };

    const getTitleClasses = () => {
      return "text-base font-bold text-slate dark:text-platinum line-clamp-1 tracking-tight";
    };

    const getActionButtons = () => {
      const buttons = [];

      if (showActions) {
        if (variant === "saved") {
          buttons.push({
            key: "unsave",
            onClick: (e) => {
              e?.preventDefault?.();
              e?.stopPropagation?.();
              handleUnsave(resource._id);
            },
            disabled: false,
            className:
              "text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600",
            icon: faTrashAlt,
            title: "Remove",
            spin: false,
          });
        } else {
          buttons.push({
            key: "save",
            onClick: (e) => {
              e?.preventDefault?.();
              e?.stopPropagation?.();
              handleSave(resource._id);
            },
            disabled: false,
            className:
              "text-amber-500 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/30 hover:text-amber-600",
            icon: faBookmark,
            title: "Save",
            spin: false,
          });
        }

        buttons.push({
          key: "flag",
          onClick: (e) => {
            e?.preventDefault?.();
            e?.stopPropagation?.();
            handleFlag(resource._id);
          },
          disabled: false,
          className:
            "text-orange-500 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/30 hover:text-orange-600",
          icon: faFlag,
          title: "Flag",
          spin: false,
        });

        if (isOwner) {
          buttons.push({
            key: "delete",
            onClick: (e) => {
              e?.preventDefault?.();
              e?.stopPropagation?.();
              handleDelete(resource._id);
            },
            disabled: false,
            className:
              "text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600",
            icon: faTrashAlt,
            title: "Delete",
            spin: false,
          });
        }
      }
      return buttons;
    };

    const actionButtons = getActionButtons();

    return (
      <div className="flex flex-col relative overflow-visible h-full w-full dark:bg-onyx bg-white shadow-md dark:shadow-glow-sm rounded-2xl p-3 max-w-[220px] group">
        <div className="absolute inset-0 bg-light-subtle dark:bg-gradient-to-br dark:from-transparent dark:via-transparent dark:to-charcoal/30 pointer-events-none rounded-xl" />
        <div className="relative z-10 flex flex-col h-full">
          {/* Thumbnail with FileType Badge */}
          <div className="mb-3 relative overflow-hidden rounded-lg">
            <img
              src={resource.thumbnailUrl || "https://res.cloudinary.com/dr9zse9a6/image/upload/v1756788547/scholara_note_qzpglu.svg"}
              alt={resource.title}
              onError={(e) => {
                e.target.onerror = null; // Prevent infinite loop
                e.target.src = "https://res.cloudinary.com/dr9zse9a6/image/upload/v1756788547/scholara_note_qzpglu.svg";
              }}
              className="w-full h-[200px] object-fit rounded-lg group-hover:scale-105 transition-transform duration-300 ease-in-out"
            />
            {/* FileType Badge - positioned at top-right of thumbnail */}
            <span
              className="absolute top-2 right-2 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold
                bg-gradient-to-r from-amber-200 to-amber-300 text-amber-800
                dark:from-charcoal dark:to-ash/20 dark:text-white
                shadow-soft-sm border border-amber-300 dark:border-charcoal/50
                transition-all duration-200 uppercase"
            >
              {resource.fileType || "DOC"}
            </span>
          </div>

          {/* Header Section - Title only */}
          <div className="mb-2">
            <h3 className={getTitleClasses()}>
              {resource.title.length > 25 ? resource.title.slice(0, 25) + "..." : resource.title}
            </h3>
          </div>

          {/* Description - More compact */}
          {showDescription && (
            <div className="mb-2">
              <p className="text-[11px] font-medium text-graphite dark:text-ash line-clamp-2 leading-tight">
                {resource.description || "No description available"}
              </p>
            </div>
          )}

          {/* Stats Section - More compact */}
          {showStats && (
            <div className="flex items-center justify-between mb-2 p-2 bg-cream/70 dark:bg-charcoal/50 shadow-inner-md rounded-lg">
              <div className="flex items-center gap-1">
                {renderStars(resource.averageRating || 0)}
                <span className="text-slate dark:text-platinum text-[10px] font-semibold">
                  {resource.averageRating?.toFixed(1) || "0.0"}
                </span>
              </div>
              <div className="flex items-center gap-1 text-graphite dark:text-ash">
                <FontAwesomeIcon icon={faDownload} className="text-[10px]" />
                <span className="text-[10px] font-semibold">{resource.downloads || 0}</span>
              </div>
            </div>
          )}

          {/* Actions Section - Tighter layout */}
          <div className="mt-auto">
            <div className="flex items-center justify-between p-1.5 bg-[#80808009] shadow-inner dark:shadow-[inset_0_2px_4px_0_rgb(0_0_0_/_0.3)] dark:bg-gradient-to-r dark:from-charcoal rounded-lg border border-silver/50 dark:border-0">
              {/* Preview Button */}
              <Link to={`/resources/${resource._id}`}>
              {showPreview && (isPDF || isImage) && (
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  whileHover={{ scale: 1.05 }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    showModal("preview", { resource });
                  }}
                  className="px-3 py-2 rounded-md bg-ivory dark:bg-charcoal hover:bg-cream dark:hover:bg-charcoal/70
                    shadow-soft-md hover:shadow-soft-lg transition-all duration-200
                    border  border-silver/50 dark:border-charcoal/60 flex items-center gap-1"
                  title="Preview"
                >
                  <FontAwesomeIcon
                    icon={faEye}
                    className="text-amber-500 dark:text-amber-400 text-[10px]"
                  />
                  <span className="text-[12px] text-amber-600 dark:text-amber-400 font-medium">
                    Preview
                  </span>
                </motion.button>
              )}
              </Link>

              {/* Dropdown Menu */}
              {actionButtons.length > 0 && (
                <div className="relative" ref={menuRef}>
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    whileHover={{ scale: 1.05 }}
                    onClick={(e) => {
                      setIsMenuOpen(!isMenuOpen);
                      e.preventDefault();
                    }}
                    className="px-1.5 py-1 rounded-md bg-ivory dark:bg-charcoal hover:bg-cream dark:hover:bg-charcoal/70
                      shadow-soft-md hover:shadow-soft-lg transition-all duration-200
                      border border-silver/50 dark:border-charcoal/60"
                    title="More actions"
                  >
                    <FontAwesomeIcon
                      icon={faEllipsisV}
                      className="text-graphite dark:text-amber-400 text-[12px]"
                    />
                  </motion.button>

                  <AnimatePresence>
                    {isMenuOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-[9998]"
                          onClick={() => setIsMenuOpen(false)}
                        />
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          transition={{ duration: 0.15 }}
                          className="absolute bottom-full mb-2 right-0 bg-ivory dark:bg-charcoal border border-silver dark:border-charcoal
                            rounded-lg shadow-2xl dark:shadow-glow-sm min-w-[120px] overflow-hidden z-[9999]"
                        >
                          {actionButtons.map((button, index) => (
                            <button
                              key={button.key}
                              onClick={(e) => {
                                button.onClick(e);
                                setIsMenuOpen(false);
                              }}
                              disabled={button.disabled}
                              className={`w-full px-3 py-2 text-left hover:bg-cream dark:hover:bg-midnight/50
                                transition-all duration-150 flex items-center gap-2 text-xs font-medium
                                disabled:opacity-50 ${button.className} ${
                                  index === 0 ? "" : "border-t border-silver/30 dark:border-charcoal/60"
                                }`}
                            >
                              <FontAwesomeIcon
                                icon={button.icon}
                                spin={button.spin}
                                className="text-xs"
                              />
                              <span>{button.title}</span>
                            </button>
                          ))}
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
);

UniversalResourceCard.displayName = "UniversalResourceCard";

export default UniversalResourceCard;