import React, { useState, useEffect } from 'react';
import {
  Building2,
  Globe,
  MapPin,
  Image as ImageIcon,
  Plus,
  Trash2,
  Save,
  CheckCircle2,
  Eye,
  ExternalLink,
  Linkedin,
  Twitter,
  Github,
  Video,
  Sparkles,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { useUpdateCompanyProfile } from '../hooks';
import type {
  CompanyProfileDto,
  CompanyLocation,
  CultureMediaItem,
  CompanySocialLinks,
  UpdateCompanyProfileDto,
} from '../types';

interface CompanyBrandingFormProps {
  profile: CompanyProfileDto;
}

export const CompanyBrandingForm: React.FC<CompanyBrandingFormProps> = ({ profile }) => {
  const [name, setName] = useState(profile.name || '');
  const [description, setDescription] = useState(profile.description || '');
  const [website, setWebsite] = useState(profile.website || '');
  const [industry, setIndustry] = useState(profile.industry || '');
  const [logoUrl, setLogoUrl] = useState(profile.logoUrl || '');
  const [coverPhotoUrl, setCoverPhotoUrl] = useState(profile.coverPhotoUrl || '');

  // Multi-location office directory
  const [locations, setLocations] = useState<CompanyLocation[]>(
    profile.locations && profile.locations.length > 0
      ? profile.locations
      : [{ city: profile.industry || 'Remote', country: 'Global', isHq: true }]
  );
  const [newCity, setNewCity] = useState('');
  const [newCountry, setNewCountry] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newIsHq, setNewIsHq] = useState(false);

  // Culture media gallery
  const [cultureMedia, setCultureMedia] = useState<CultureMediaItem[]>(
    profile.cultureMedia || []
  );
  const [newMediaUrl, setNewMediaUrl] = useState('');
  const [newMediaType, setNewMediaType] = useState<'IMAGE' | 'VIDEO'>('IMAGE');
  const [newMediaCaption, setNewMediaCaption] = useState('');

  // Social links
  const [socialLinks, setSocialLinks] = useState<CompanySocialLinks>(
    profile.socialLinks || {}
  );

  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const updateMutation = useUpdateCompanyProfile();

  useEffect(() => {
    setName(profile.name || '');
    setDescription(profile.description || '');
    setWebsite(profile.website || '');
    setIndustry(profile.industry || '');
    setLogoUrl(profile.logoUrl || '');
    setCoverPhotoUrl(profile.coverPhotoUrl || '');
    setLocations(profile.locations || []);
    setCultureMedia(profile.cultureMedia || []);
    setSocialLinks(profile.socialLinks || {});
  }, [profile]);

  // Office Location Handlers
  const handleAddLocation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCity.trim() || !newCountry.trim()) return;

    const nextLocations = [...locations];
    if (newIsHq) {
      // Unset previous HQs
      nextLocations.forEach((loc) => (loc.isHq = false));
    }

    nextLocations.push({
      city: newCity.trim(),
      country: newCountry.trim(),
      address: newAddress.trim() || undefined,
      isHq: newIsHq || nextLocations.length === 0,
    });

    setLocations(nextLocations);
    setNewCity('');
    setNewCountry('');
    setNewAddress('');
    setNewIsHq(false);
  };

  const handleRemoveLocation = (index: number) => {
    setLocations(locations.filter((_, i) => i !== index));
  };

  // Culture Media Handlers
  const handleAddMedia = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMediaUrl.trim()) return;

    setCultureMedia([
      ...cultureMedia,
      {
        url: newMediaUrl.trim(),
        type: newMediaType,
        caption: newMediaCaption.trim() || undefined,
      },
    ]);

    setNewMediaUrl('');
    setNewMediaCaption('');
  };

  const handleRemoveMedia = (index: number) => {
    setCultureMedia(cultureMedia.filter((_, i) => i !== index));
  };

  // Submit
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSaveSuccess(false);

    const payload: UpdateCompanyProfileDto = {
      name: name.trim(),
      description: description.trim() || undefined,
      website: website.trim() || undefined,
      industry: industry.trim() || undefined,
      logoUrl: logoUrl.trim() || undefined,
      coverPhotoUrl: coverPhotoUrl.trim() || undefined,
      locations,
      cultureMedia,
      socialLinks,
    };

    try {
      await updateMutation.mutateAsync(payload);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err: any) {
      setErrorMsg(
        err.response?.data?.message || err.message || 'Failed to update company branding profile'
      );
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Visual Header with Cover Photo and Logo */}
      <div className="relative rounded-2xl overflow-hidden border border-border-default bg-surface shadow-xs">
        {/* Cover Photo Banner */}
        <div className="h-44 sm:h-56 w-full bg-gradient-to-r from-brand-800 via-indigo-900 to-purple-900 relative">
          {coverPhotoUrl ? (
            <img
              src={coverPhotoUrl}
              alt="Company Cover"
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white/40 text-xs font-semibold">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5" />
                <span>Upload a branded cover photo banner (1200x320 recommended)</span>
              </div>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        </div>

        {/* Company Header Info Bar */}
        <div className="p-6 sm:px-8 bg-surface flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 -mt-12 relative z-10">
          <div className="flex items-end gap-4">
            {/* Logo */}
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-surface border-4 border-surface shadow-md overflow-hidden flex items-center justify-center shrink-0">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-full h-full bg-brand-50 flex items-center justify-center text-brand-600 font-bold text-2xl">
                  {name ? name.substring(0, 2).toUpperCase() : 'CO'}
                </div>
              )}
            </div>

            <div className="pb-1">
              <h1 className="text-xl sm:text-2xl font-bold text-text-primary tracking-tight">
                {name || 'Your Company Name'}
              </h1>
              <p className="text-xs text-text-secondary flex items-center gap-2 mt-0.5">
                <span>{industry || 'Technology & Software'}</span>
                <span>•</span>
                <span>{locations.find((l) => l.isHq)?.city || 'Global HQ'}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsPreviewOpen(true)}
              className="gap-1.5 text-xs flex-1 sm:flex-initial"
            >
              <Eye className="w-3.5 h-3.5 text-text-muted" />
              <span>Public Preview</span>
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleSave}
              isLoading={updateMutation.isPending}
              className="gap-1.5 flex-1 sm:flex-initial"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Branding</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {saveSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2 font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Company profile, media gallery, and office locations updated successfully!</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
          {errorMsg}
        </div>
      )}

      {/* Form Sections Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Columns: Core Info & Media */}
        <div className="lg:col-span-2 space-y-6">
          {/* Core Info Card */}
          <div className="bg-surface rounded-2xl border border-border-default p-6 space-y-4 shadow-xs">
            <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
              <Building2 className="w-4 h-4 text-brand-600" />
              <span>General Organization Information</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-text-primary">
                  Company Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-10 px-3 bg-surface rounded-xl border border-border-default text-xs text-text-primary outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-text-primary">
                  Primary Website URL
                </label>
                <input
                  type="url"
                  placeholder="https://company.com"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className="w-full h-10 px-3 bg-surface rounded-xl border border-border-default text-xs text-text-primary outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-text-primary">
                  Industry & Domain
                </label>
                <input
                  type="text"
                  placeholder="E.g. FinTech, Artificial Intelligence, Healthcare"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="w-full h-10 px-3 bg-surface rounded-xl border border-border-default text-xs text-text-primary outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-text-primary">
                  Company Logo Image URL
                </label>
                <input
                  type="url"
                  placeholder="https://.../logo.png"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  className="w-full h-10 px-3 bg-surface rounded-xl border border-border-default text-xs text-text-primary outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-text-primary">
                Cover Banner Image URL
              </label>
              <input
                type="url"
                placeholder="https://.../banner.jpg"
                value={coverPhotoUrl}
                onChange={(e) => setCoverPhotoUrl(e.target.value)}
                className="w-full h-10 px-3 bg-surface rounded-xl border border-border-default text-xs text-text-primary outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-text-primary">
                About the Company & Culture Mission
              </label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tell applicants what makes your company unique, your mission, and the perks of working with your team..."
                className="w-full p-3 bg-surface rounded-xl border border-border-default text-xs text-text-primary outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600 resize-none placeholder:text-text-muted"
              />
            </div>
          </div>

          {/* Culture Media Gallery Card */}
          <div className="bg-surface rounded-2xl border border-border-default p-6 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  <span>Workplace Culture & Media Gallery</span>
                </h3>
                <p className="text-xs text-text-secondary mt-0.5">
                  Showcase office photos, team offsites, and video tours on job vacancy pages.
                </p>
              </div>
              <span className="text-xs font-semibold text-text-muted">
                {cultureMedia.length} Items
              </span>
            </div>

            {/* Add Media Input Row */}
            <form onSubmit={handleAddMedia} className="p-3.5 rounded-xl bg-surface-muted border border-border-default space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <input
                  type="url"
                  placeholder="Media URL (e.g. image or video embed)"
                  value={newMediaUrl}
                  onChange={(e) => setNewMediaUrl(e.target.value)}
                  className="sm:col-span-2 h-9 px-3 bg-surface rounded-lg border border-border-default text-xs text-text-primary outline-none focus:border-brand-600"
                />
                <select
                  value={newMediaType}
                  onChange={(e) => setNewMediaType(e.target.value as 'IMAGE' | 'VIDEO')}
                  className="h-9 px-2 bg-surface rounded-lg border border-border-default text-xs text-text-primary outline-none focus:border-brand-600"
                >
                  <option value="IMAGE">Photo / Image</option>
                  <option value="VIDEO">Video Link</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Optional caption (e.g., Annual hackathon team dinner)"
                  value={newMediaCaption}
                  onChange={(e) => setNewMediaCaption(e.target.value)}
                  className="flex-1 h-9 px-3 bg-surface rounded-lg border border-border-default text-xs text-text-primary outline-none focus:border-brand-600"
                />
                <Button type="submit" variant="outline" size="sm" className="h-9 gap-1 text-xs">
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </Button>
              </div>
            </form>

            {/* Media Gallery Grid */}
            {cultureMedia.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {cultureMedia.map((item, idx) => (
                  <div
                    key={idx}
                    className="group relative rounded-xl border border-border-default overflow-hidden bg-surface-muted aspect-video"
                  >
                    {item.type === 'IMAGE' ? (
                      <img
                        src={item.url}
                        alt={item.caption || 'Culture photo'}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            'https://placehold.co/400x250?text=Culture+Photo';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-text-secondary bg-surface-hover">
                        <Video className="w-6 h-6 text-brand-600 mb-1" />
                        <span className="text-[10px] font-bold uppercase">Video Asset</span>
                      </div>
                    )}

                    {item.caption && (
                      <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/80 to-transparent text-white text-[10px] line-clamp-1">
                        {item.caption}
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => handleRemoveMedia(idx)}
                      className="absolute top-2 right-2 p-1 rounded-lg bg-black/60 hover:bg-rose-600 text-white opacity-0 group-hover:opacity-100 transition-all"
                      aria-label="Remove media"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-text-muted italic text-center py-4">
                No culture media items added yet. Add photo links above to showcase your workplace culture.
              </p>
            )}
          </div>
        </div>

        {/* Right 1 Column: Locations & Social Links */}
        <div className="space-y-6">
          {/* Multi-Location Directory Card */}
          <div className="bg-surface rounded-2xl border border-border-default p-6 space-y-4 shadow-xs">
            <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-600" />
              <span>Office Locations</span>
            </h3>

            {/* Add Location Form */}
            <form onSubmit={handleAddLocation} className="p-3.5 rounded-xl bg-surface-muted border border-border-default space-y-2.5">
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  required
                  placeholder="City (e.g. London)"
                  value={newCity}
                  onChange={(e) => setNewCity(e.target.value)}
                  className="h-8 px-2.5 bg-surface rounded-lg border border-border-default text-xs text-text-primary outline-none focus:border-brand-600"
                />
                <input
                  type="text"
                  required
                  placeholder="Country (e.g. UK)"
                  value={newCountry}
                  onChange={(e) => setNewCountry(e.target.value)}
                  className="h-8 px-2.5 bg-surface rounded-lg border border-border-default text-xs text-text-primary outline-none focus:border-brand-600"
                />
              </div>

              <input
                type="text"
                placeholder="Street address (optional)"
                value={newAddress}
                onChange={(e) => setNewAddress(e.target.value)}
                className="w-full h-8 px-2.5 bg-surface rounded-lg border border-border-default text-xs text-text-primary outline-none focus:border-brand-600"
              />

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-1.5 text-xs text-text-secondary cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newIsHq}
                    onChange={(e) => setNewIsHq(e.target.checked)}
                    className="rounded text-brand-600 focus:ring-brand-500 w-3.5 h-3.5"
                  />
                  <span>Primary HQ</span>
                </label>

                <Button type="submit" variant="outline" size="sm" className="h-7 text-xs px-2.5 gap-1">
                  <Plus className="w-3 h-3" />
                  <span>Add Office</span>
                </Button>
              </div>
            </form>

            {/* List of locations */}
            <div className="space-y-2">
              {locations.map((loc, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-xl border border-border-default bg-surface hover:bg-surface-muted/50 flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-xs text-text-primary">
                        {loc.city}, {loc.country}
                      </span>
                      {loc.isHq && (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          HQ
                        </span>
                      )}
                    </div>
                    {loc.address && (
                      <p className="text-[11px] text-text-muted truncate">{loc.address}</p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveLocation(idx)}
                    className="text-text-muted hover:text-rose-600 p-1"
                    aria-label="Delete location"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Social Links Card */}
          <div className="bg-surface rounded-2xl border border-border-default p-6 space-y-4 shadow-xs">
            <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
              <Globe className="w-4 h-4 text-indigo-600" />
              <span>Social & Online Presence</span>
            </h3>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-text-secondary flex items-center gap-1.5">
                  <Linkedin className="w-3.5 h-3.5 text-blue-600" />
                  <span>LinkedIn Profile URL</span>
                </label>
                <input
                  type="url"
                  placeholder="https://linkedin.com/company/..."
                  value={socialLinks.linkedin || ''}
                  onChange={(e) =>
                    setSocialLinks({ ...socialLinks, linkedin: e.target.value })
                  }
                  className="w-full h-9 px-3 bg-surface rounded-xl border border-border-default text-xs text-text-primary outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-text-secondary flex items-center gap-1.5">
                  <Twitter className="w-3.5 h-3.5 text-sky-500" />
                  <span>Twitter / X Profile URL</span>
                </label>
                <input
                  type="url"
                  placeholder="https://twitter.com/..."
                  value={socialLinks.twitter || ''}
                  onChange={(e) =>
                    setSocialLinks({ ...socialLinks, twitter: e.target.value })
                  }
                  className="w-full h-9 px-3 bg-surface rounded-xl border border-border-default text-xs text-text-primary outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-text-secondary flex items-center gap-1.5">
                  <Github className="w-3.5 h-3.5 text-gray-700" />
                  <span>GitHub Organization</span>
                </label>
                <input
                  type="url"
                  placeholder="https://github.com/..."
                  value={socialLinks.github || ''}
                  onChange={(e) =>
                    setSocialLinks({ ...socialLinks, github: e.target.value })
                  }
                  className="w-full h-9 px-3 bg-surface rounded-xl border border-border-default text-xs text-text-primary outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Public Preview Modal */}
      {isPreviewOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-2xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
          <div className="w-full max-w-3xl bg-surface rounded-2xl shadow-2xl border border-border-default overflow-hidden">
            <div className="p-4 border-b border-border-default flex items-center justify-between bg-surface-muted">
              <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                Candidate View Preview
              </span>
              <button
                onClick={() => setIsPreviewOpen(false)}
                className="p-1 rounded-lg text-text-muted hover:text-text-primary"
              >
                Close
              </button>
            </div>

            <div className="max-h-[80vh] overflow-y-auto">
              <div className="h-48 w-full bg-brand-900 relative">
                {coverPhotoUrl && (
                  <img
                    src={coverPhotoUrl}
                    alt="Cover"
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              <div className="p-6 -mt-12 relative">
                <div className="w-20 h-20 rounded-2xl bg-surface border-4 border-surface shadow overflow-hidden mb-3">
                  {logoUrl ? (
                    <img src={logoUrl} alt={name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-brand-100 flex items-center justify-center text-brand-600 font-bold text-xl">
                      {name.substring(0, 2).toUpperCase()}
                    </div>
                  )}
                </div>
                <h2 className="text-xl font-bold text-text-primary">{name}</h2>
                <p className="text-xs text-text-secondary mb-4">
                  {industry} • {locations.find((l) => l.isHq)?.city || 'Global HQ'}
                </p>
                <p className="text-xs text-text-primary leading-relaxed whitespace-pre-line mb-6">
                  {description || 'No description provided.'}
                </p>

                {cultureMedia.length > 0 && (
                  <div className="space-y-2 pt-4 border-t border-border-default">
                    <h4 className="text-xs font-bold text-text-primary">Life at {name}</h4>
                    <div className="grid grid-cols-3 gap-2">
                      {cultureMedia.slice(0, 3).map((item, idx) => (
                        <div key={idx} className="rounded-lg overflow-hidden aspect-video bg-surface-muted">
                          {item.type === 'IMAGE' && (
                            <img src={item.url} alt="media" className="w-full h-full object-cover" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyBrandingForm;
