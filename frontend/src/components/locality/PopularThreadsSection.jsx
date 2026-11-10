import { useState } from 'react';
import {
  Flame,
  MessageSquare,
  MapPin,
  CheckCircle2,
  Bell,
  ArrowRight,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { deleteThread } from '../../api/locality';

export default function PopularThreadsSection({
  threads,
  myThreads,
  currentUser,
  onSelectThread,
  onRefresh,
}) {
  const [activeTab, setActiveTab] = useState('popular'); // 'popular' | 'my-threads'
  const [deletingId, setDeletingId] = useState(null);
  const [viewingNotifsThreadId, setViewingNotifsThreadId] = useState(null);

  const handleDelete = async (threadId) => {
    if (!window.confirm('Are you sure you want to mark this issue as resolved and close the thread? This will close discussion and clear all related data.')) {
      return;
    }

    setDeletingId(threadId);
    try {
      await deleteThread(threadId);
      onRefresh();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to close thread.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-5">
      {/* Tab Switcher & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
            <Flame className="w-5 h-5 text-amber-500" />
            <span>Community Pollution Threads</span>
          </h3>
          <p className="text-xs text-slate-500">
            Ranked by discussion activity and neighbor reports.
          </p>
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('popular')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'popular'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Popular Threads</span>
            <span className="px-1.5 py-0.2 rounded-md bg-slate-200 text-[10px] text-slate-700">
              {threads.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('my-threads')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'my-threads'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>My Threads</span>
            {myThreads.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-md bg-emerald-100 text-[10px] text-emerald-800 font-extrabold">
                {myThreads.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Tab 1: Popular Threads in Locality */}
      {activeTab === 'popular' && (
        <div>
          {threads.length === 0 ? (
            <div className="text-center py-12 px-4 border border-dashed border-slate-200 rounded-2xl">
              <Sparkles className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-slate-700">No pollution threads in your locality yet</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Be the first to report a pollution factor point below to start a community discussion.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {threads.map((t) => (
                <div
                  key={t.id}
                  className="p-4 rounded-2xl border border-slate-200/70 hover:border-emerald-300 hover:shadow-md bg-white transition-all flex flex-col justify-between group"
                >
                  <div>
                    {/* Header: Title + Messages Count Badge */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h4 className="text-sm font-bold text-slate-900 line-clamp-1 group-hover:text-emerald-700 transition-colors">
                        {t.title}
                      </h4>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-700 border border-amber-200/60 flex items-center gap-1 flex-shrink-0">
                        <MessageSquare className="w-3 h-3" />
                        <span>{t.message_count || 0}</span>
                      </span>
                    </div>

                    {/* Description snippet */}
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-3">
                      {t.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-emerald-600" />
                      <span>{t.distance_km ? `${t.distance_km} km away` : 'Locality'}</span>
                    </span>

                    <button
                      type="button"
                      onClick={() => onSelectThread(t)}
                      className="font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 transition-colors"
                    >
                      <span>Discuss</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: My Created Threads */}
      {activeTab === 'my-threads' && (
        <div>
          {!currentUser ? (
            <div className="text-center py-8 text-xs text-slate-500">
              Please sign in to view and manage your reported threads.
            </div>
          ) : myThreads.length === 0 ? (
            <div className="text-center py-12 px-4 border border-dashed border-slate-200 rounded-2xl">
              <CheckCircle2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-slate-700">You haven't created any threads yet</h4>
              <p className="text-xs text-slate-400 mt-1">
                When you spot burning garbage, construction dust, or industrial smoke, use the form below to report it.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {myThreads.map((t) => {
                const notifsCount = t.notifications?.length || t.resolve_notifications_count || 0;
                const isViewingNotifs = viewingNotifsThreadId === t.id;

                return (
                  <div
                    key={t.id}
                    className="p-4 rounded-2xl border border-slate-200/80 bg-white hover:shadow-xs transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-bold text-slate-900 truncate">
                          {t.title}
                        </h4>
                        <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <MessageSquare className="w-3 h-3" />
                          <span>{t.message_count || 0} messages</span>
                        </span>

                        {notifsCount > 0 && (
                          <button
                            type="button"
                            onClick={() =>
                              setViewingNotifsThreadId(isViewingNotifs ? null : t.id)
                            }
                            className="text-[10px] font-extrabold text-emerald-800 bg-emerald-100/80 hover:bg-emerald-200/80 px-2.5 py-0.5 rounded-full flex items-center gap-1 transition-colors"
                          >
                            <Bell className="w-3 h-3 text-emerald-700" />
                            <span>{notifsCount} Resolution Notification{notifsCount > 1 ? 's' : ''}!</span>
                          </button>
                        )}
                      </div>

                      <p className="text-xs text-slate-600 line-clamp-2">
                        {t.description}
                      </p>

                      {/* Expandable Notification Details */}
                      {isViewingNotifs && t.notifications?.length > 0 && (
                        <div className="mt-2 p-3 bg-emerald-50/70 border border-emerald-100 rounded-xl space-y-2 text-xs">
                          <span className="font-bold text-[11px] text-emerald-950 block">
                            Neighbors who reported this issue as resolved:
                          </span>
                          {t.notifications.map((n) => (
                            <div key={n.id} className="text-slate-700 flex items-center justify-between">
                              <span>
                                <strong className="text-emerald-900">@{n.notifier_username}</strong>: "{n.note}"
                              </span>
                              <span className="text-[10px] text-slate-400">
                                {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Actions: View Discussion & Mark Resolved / Close */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => onSelectThread(t)}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors"
                      >
                        Open Discussion
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(t.id)}
                        disabled={deletingId === t.id}
                        className="px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 text-xs font-bold transition-colors flex items-center gap-1.5 disabled:opacity-50"
                      >
                        {deletingId === t.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-3.5 h-3.5 text-red-600" />
                        )}
                        <span>Mark as Resolved & Close</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
